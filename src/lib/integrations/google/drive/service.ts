/**
 * Google Drive Service Layer
 *
 * High-level service for screenshot fetching and report delivery
 */

import { DriveClient, DriveApiError } from "./client";
import {
  GoogleConfig,
  ScreenshotFile,
  ScreenshotFetchResult,
  ReportUploadResult,
  UploadOptions,
  GOOGLE_SLIDES_MIME_TYPE,
  XLSX_MIME_TYPE,
} from "./types";
import {
  DriveTokenExpiredError,
  DriveRateLimitError,
  DrivePermissionError,
  DriveFolderNotFoundError,
} from "./errors";

// Re-use auth from analytics (same Google OAuth)
import { ensureValidToken } from "../analytics/auth";

export interface DriveCredential {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}

export interface ClientFolders {
  screenshotsFolderId: string;
  reportsFolderId: string;
}

/**
 * Drive Service for managing screenshots and report delivery
 */
export class DriveService {
  private config: GoogleConfig;

  constructor(config?: Partial<GoogleConfig>) {
    this.config = {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: process.env.GOOGLE_REDIRECT_URI || "",
      ...config,
    };
  }

  /**
   * Create a client instance with the given access token
   */
  private createClient(accessToken: string): DriveClient {
    return new DriveClient(accessToken, this.config);
  }

  /**
   * Validate and potentially refresh credentials
   */
  async validateCredential(credential: DriveCredential): Promise<{
    valid: boolean;
    reason?: string;
    newAccessToken?: string;
    newExpiresAt?: Date;
  }> {
    try {
      const result = await ensureValidToken(
        credential.accessToken,
        credential.refreshToken,
        credential.expiresAt,
        this.config
      );

      return {
        valid: true,
        newAccessToken: result.refreshed ? result.accessToken : undefined,
        newExpiresAt: result.refreshed ? result.expiresAt : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Token validation failed";
      return { valid: false, reason: message };
    }
  }

  /**
   * Fetch screenshots from a client's folder
   */
  async fetchScreenshots(
    credential: DriveCredential,
    folderId: string,
    limit = 20
  ): Promise<ScreenshotFetchResult> {
    try {
      // Validate credential
      const validation = await this.validateCredential(credential);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.reason,
        };
      }

      const accessToken = validation.newAccessToken || credential.accessToken;
      const client = this.createClient(accessToken);

      // Verify folder exists
      await client.getFolder(folderId);

      // Get screenshots
      const screenshots = await client.getScreenshots(folderId, limit);

      return {
        success: true,
        screenshots,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Download a screenshot
   */
  async downloadScreenshot(
    credential: DriveCredential,
    fileId: string
  ): Promise<{
    success: boolean;
    content?: Buffer;
    mimeType?: string;
    name?: string;
    error?: string;
  }> {
    try {
      const validation = await this.validateCredential(credential);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      const accessToken = validation.newAccessToken || credential.accessToken;
      const client = this.createClient(accessToken);

      const result = await client.downloadFile(fileId);

      return {
        success: true,
        content: result.content,
        mimeType: result.mimeType,
        name: result.name,
      };
    } catch (error) {
      const errorResult = this.handleError(error);
      return { success: false, error: errorResult.error };
    }
  }

  /**
   * Upload a report to client's folder
   */
  async uploadReport(
    credential: DriveCredential,
    folderId: string,
    content: Buffer,
    options: {
      name: string;
      mimeType: string;
      description?: string;
    }
  ): Promise<ReportUploadResult> {
    try {
      const validation = await this.validateCredential(credential);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      const accessToken = validation.newAccessToken || credential.accessToken;
      const client = this.createClient(accessToken);

      // Verify folder exists
      await client.getFolder(folderId);

      // Upload file
      const file = await client.uploadFile(content, {
        name: options.name,
        mimeType: options.mimeType,
        folderId,
        description: options.description,
      });

      return {
        success: true,
        fileId: file.id,
        webViewLink: file.webViewLink,
      };
    } catch (error) {
      return this.handleUploadError(error);
    }
  }

  /**
   * Copy a Google Slides template
   */
  async copyTemplate(
    credential: DriveCredential,
    templateFileId: string,
    newName: string,
    destinationFolderId?: string
  ): Promise<{
    success: boolean;
    fileId?: string;
    webViewLink?: string;
    error?: string;
  }> {
    try {
      const validation = await this.validateCredential(credential);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      const accessToken = validation.newAccessToken || credential.accessToken;
      const client = this.createClient(accessToken);

      const file = await client.copyFile(templateFileId, newName, destinationFolderId);

      return {
        success: true,
        fileId: file.id,
        webViewLink: file.webViewLink,
      };
    } catch (error) {
      const errorResult = this.handleError(error);
      return { success: false, error: errorResult.error };
    }
  }

  /**
   * Create client report folders structure
   */
  async createClientFolders(
    credential: DriveCredential,
    clientName: string,
    parentFolderId?: string
  ): Promise<{
    success: boolean;
    folders?: ClientFolders;
    error?: string;
  }> {
    try {
      const validation = await this.validateCredential(credential);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      const accessToken = validation.newAccessToken || credential.accessToken;
      const client = this.createClient(accessToken);

      // Create main client folder
      const clientFolder = await client.createFolder(clientName, parentFolderId);

      // Create subfolders
      const [screenshotsFolder, reportsFolder] = await Promise.all([
        client.createFolder("Screenshots", clientFolder.id),
        client.createFolder("Reports", clientFolder.id),
      ]);

      return {
        success: true,
        folders: {
          screenshotsFolderId: screenshotsFolder.id,
          reportsFolderId: reportsFolder.id,
        },
      };
    } catch (error) {
      const errorResult = this.handleError(error);
      return { success: false, error: errorResult.error };
    }
  }

  /**
   * Handle general errors
   */
  private handleError(error: unknown): ScreenshotFetchResult {
    if (error instanceof DriveApiError) {
      if (error.isTokenExpired()) {
        return { success: false, error: "Access token has expired" };
      }
      if (error.isRateLimited()) {
        return { success: false, error: "Rate limit exceeded" };
      }
      if (error.isPermissionError()) {
        return { success: false, error: "Permission denied" };
      }
      if (error.isNotFound()) {
        return { success: false, error: "File or folder not found" };
      }
      return { success: false, error: error.message };
    }

    if (error instanceof DriveFolderNotFoundError) {
      return { success: false, error: error.message };
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Drive service error:", error);

    return { success: false, error: message };
  }

  /**
   * Handle upload errors
   */
  private handleUploadError(error: unknown): ReportUploadResult {
    const result = this.handleError(error);
    return { success: false, error: result.error };
  }
}

/**
 * Create a singleton service instance
 */
let serviceInstance: DriveService | null = null;

export function getDriveService(config?: Partial<GoogleConfig>): DriveService {
  if (!serviceInstance) {
    serviceInstance = new DriveService(config);
  }
  return serviceInstance;
}
