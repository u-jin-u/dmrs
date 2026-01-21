/**
 * Google Drive API Client
 */

import {
  DRIVE_API_URL,
  DRIVE_UPLOAD_URL,
  GoogleConfig,
  DriveFile,
  DriveFolder,
  DriveFileListResponse,
  UploadOptions,
  DownloadResult,
  ScreenshotFile,
  DriveErrorResponse,
  SCREENSHOT_MIME_TYPES,
  FolderQueryOptions,
} from "./types";
import {
  DriveFileNotFoundError,
  DriveFolderNotFoundError,
  DrivePermissionError,
  DriveRateLimitError,
  DriveDownloadError,
  DriveUploadError,
} from "./errors";

/**
 * Drive API Error class
 */
export class DriveApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public reason?: string
  ) {
    super(message);
    this.name = "DriveApiError";
  }

  isRateLimited(): boolean {
    return this.code === 429 || this.reason === "rateLimitExceeded";
  }

  isTokenExpired(): boolean {
    return this.code === 401;
  }

  isPermissionError(): boolean {
    return this.code === 403;
  }

  isNotFound(): boolean {
    return this.code === 404;
  }
}

/**
 * Google Drive API client
 */
export class DriveClient {
  private accessToken: string;
  private config?: GoogleConfig;

  constructor(accessToken: string, config?: GoogleConfig) {
    this.accessToken = accessToken;
    this.config = config;
  }

  /**
   * Make authenticated request to Drive API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${DRIVE_API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    });

    // Handle binary responses (downloads)
    if (options.headers && (options.headers as Record<string, string>)["Accept"] === "*/*") {
      if (!response.ok) {
        throw new DriveApiError("Download failed", response.status);
      }
      return response as unknown as T;
    }

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as DriveErrorResponse;
      const errorInfo = errorData.error?.errors?.[0];
      throw new DriveApiError(
        errorData.error?.message || "Unknown Drive API error",
        errorData.error?.code || response.status,
        errorInfo?.reason
      );
    }

    return data as T;
  }

  /**
   * Get file metadata by ID
   */
  async getFile(fileId: string): Promise<DriveFile> {
    const fields = "id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink,parents,trashed";
    return this.request<DriveFile>(`/files/${fileId}?fields=${fields}`);
  }

  /**
   * Get folder metadata by ID
   */
  async getFolder(folderId: string): Promise<DriveFolder> {
    try {
      const file = await this.getFile(folderId);
      if (file.mimeType !== "application/vnd.google-apps.folder") {
        throw new DriveFolderNotFoundError(folderId);
      }
      return {
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        parents: file.parents,
      };
    } catch (error) {
      if (error instanceof DriveApiError && error.isNotFound()) {
        throw new DriveFolderNotFoundError(folderId);
      }
      throw error;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(options: FolderQueryOptions): Promise<DriveFileListResponse> {
    const {
      folderId,
      mimeTypes,
      pageSize = 100,
      pageToken,
      orderBy = "createdTime",
      orderDirection = "desc",
    } = options;

    // Build query
    let query = `'${folderId}' in parents and trashed = false`;

    if (mimeTypes && mimeTypes.length > 0) {
      const mimeTypeQuery = mimeTypes
        .map((type) => `mimeType = '${type}'`)
        .join(" or ");
      query += ` and (${mimeTypeQuery})`;
    }

    const params = new URLSearchParams({
      q: query,
      fields: "files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink),nextPageToken",
      pageSize: pageSize.toString(),
      orderBy: `${orderBy} ${orderDirection}`,
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    return this.request<DriveFileListResponse>(`/files?${params.toString()}`);
  }

  /**
   * Get screenshots from a folder
   */
  async getScreenshots(
    folderId: string,
    limit = 20
  ): Promise<ScreenshotFile[]> {
    const response = await this.listFiles({
      folderId,
      mimeTypes: [...SCREENSHOT_MIME_TYPES],
      pageSize: limit,
      orderBy: "createdTime",
      orderDirection: "desc",
    });

    return response.files.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      downloadUrl: `${DRIVE_API_URL}/files/${file.id}?alt=media`,
      thumbnailUrl: file.thumbnailLink,
      createdTime: new Date(file.createdTime || Date.now()),
    }));
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string): Promise<DownloadResult> {
    // First get metadata
    const metadata = await this.getFile(fileId);

    // Download content
    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new DriveDownloadError(`Failed to download file: ${response.status}`, fileId);
    }

    const arrayBuffer = await response.arrayBuffer();
    const content = Buffer.from(arrayBuffer);

    return {
      content,
      mimeType: metadata.mimeType,
      name: metadata.name,
    };
  }

  /**
   * Upload file to Drive
   */
  async uploadFile(
    content: Buffer | string,
    options: UploadOptions
  ): Promise<DriveFile> {
    const { name, mimeType, folderId, description } = options;

    // Create metadata
    const metadata: Record<string, unknown> = {
      name,
      mimeType,
    };

    if (folderId) {
      metadata.parents = [folderId];
    }

    if (description) {
      metadata.description = description;
    }

    // Multipart upload
    const boundary = "-------boundary" + Date.now();
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelimiter = "\r\n--" + boundary + "--";

    const contentBuffer = typeof content === "string"
      ? Buffer.from(content)
      : content;

    const multipartBody = Buffer.concat([
      Buffer.from(
        delimiter +
          "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType}\r\n` +
          "Content-Transfer-Encoding: base64\r\n\r\n"
      ),
      Buffer.from(contentBuffer.toString("base64")),
      Buffer.from(closeDelimiter),
    ]);

    const response = await fetch(
      `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as DriveErrorResponse;
      throw new DriveUploadError(
        errorData.error?.message || "Failed to upload file",
        name
      );
    }

    return data as DriveFile;
  }

  /**
   * Create a folder
   */
  async createFolder(
    name: string,
    parentFolderId?: string
  ): Promise<DriveFolder> {
    const metadata: Record<string, unknown> = {
      name,
      mimeType: "application/vnd.google-apps.folder",
    };

    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const response = await fetch(
      `${DRIVE_API_URL}/files?fields=id,name,webViewLink`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as DriveErrorResponse;
      throw new DriveApiError(
        errorData.error?.message || "Failed to create folder",
        errorData.error?.code || response.status
      );
    }

    return data as DriveFolder;
  }

  /**
   * Move file to a folder
   */
  async moveFile(fileId: string, newFolderId: string): Promise<DriveFile> {
    // Get current parents
    const file = await this.getFile(fileId);
    const previousParents = file.parents?.join(",") || "";

    const params = new URLSearchParams({
      addParents: newFolderId,
      removeParents: previousParents,
      fields: "id,name,mimeType,webViewLink,parents",
    });

    const response = await fetch(
      `${DRIVE_API_URL}/files/${fileId}?${params.toString()}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as DriveErrorResponse;
      throw new DriveApiError(
        errorData.error?.message || "Failed to move file",
        errorData.error?.code || response.status
      );
    }

    return data as DriveFile;
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      throw new DriveApiError("Failed to delete file", response.status);
    }
  }

  /**
   * Copy file
   */
  async copyFile(
    fileId: string,
    newName: string,
    destinationFolderId?: string
  ): Promise<DriveFile> {
    const metadata: Record<string, unknown> = {
      name: newName,
    };

    if (destinationFolderId) {
      metadata.parents = [destinationFolderId];
    }

    const response = await fetch(
      `${DRIVE_API_URL}/files/${fileId}/copy?fields=id,name,mimeType,webViewLink`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as DriveErrorResponse;
      throw new DriveApiError(
        errorData.error?.message || "Failed to copy file",
        errorData.error?.code || response.status
      );
    }

    return data as DriveFile;
  }
}
