/**
 * Google Drive API Types
 */

export const DRIVE_API_VERSION = "v3";
export const DRIVE_API_URL = `https://www.googleapis.com/drive/${DRIVE_API_VERSION}`;
export const DRIVE_UPLOAD_URL = `https://www.googleapis.com/upload/drive/${DRIVE_API_VERSION}`;

/**
 * Google Drive configuration (shared with Analytics)
 */
export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Drive file metadata
 */
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  trashed?: boolean;
}

/**
 * Drive folder metadata
 */
export interface DriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
  parents?: string[];
}

/**
 * File list response
 */
export interface DriveFileListResponse {
  files: DriveFile[];
  nextPageToken?: string;
  incompleteSearch?: boolean;
}

/**
 * Upload file options
 */
export interface UploadOptions {
  name: string;
  mimeType: string;
  folderId?: string;
  description?: string;
}

/**
 * File download result
 */
export interface DownloadResult {
  content: Buffer;
  mimeType: string;
  name: string;
}

/**
 * Screenshot file info
 */
export interface ScreenshotFile {
  id: string;
  name: string;
  mimeType: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  createdTime: Date;
}

/**
 * Screenshot fetch result
 */
export interface ScreenshotFetchResult {
  success: boolean;
  screenshots?: ScreenshotFile[];
  error?: string;
}

/**
 * Report upload result
 */
export interface ReportUploadResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

/**
 * Supported image MIME types for screenshots
 */
export const SCREENSHOT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
] as const;

/**
 * Google Slides MIME type
 */
export const GOOGLE_SLIDES_MIME_TYPE =
  "application/vnd.google-apps.presentation";

/**
 * Google Sheets MIME type
 */
export const GOOGLE_SHEETS_MIME_TYPE =
  "application/vnd.google-apps.spreadsheet";

/**
 * Excel MIME type
 */
export const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Drive API error response
 */
export interface DriveErrorResponse {
  error: {
    code: number;
    message: string;
    errors?: Array<{
      domain: string;
      reason: string;
      message: string;
    }>;
  };
}

/**
 * Required scopes for Drive access
 */
export const DRIVE_REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/drive.file", // Access to files created by the app
  "https://www.googleapis.com/auth/drive.readonly", // Read access to all files
] as const;

/**
 * Folder query options
 */
export interface FolderQueryOptions {
  folderId: string;
  mimeTypes?: string[];
  pageSize?: number;
  pageToken?: string;
  orderBy?: "createdTime" | "modifiedTime" | "name";
  orderDirection?: "asc" | "desc";
}
