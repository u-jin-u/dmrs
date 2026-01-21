/**
 * Google Drive Integration
 *
 * Public API for screenshots and report delivery
 */

// Client
export { DriveClient, DriveApiError } from "./client";

// Service
export {
  DriveService,
  getDriveService,
  type DriveCredential,
  type ClientFolders,
} from "./service";

// Types
export type {
  GoogleConfig,
  DriveFile,
  DriveFolder,
  DriveFileListResponse,
  UploadOptions,
  DownloadResult,
  ScreenshotFile,
  ScreenshotFetchResult,
  ReportUploadResult,
  DriveErrorResponse,
  FolderQueryOptions,
} from "./types";

export {
  DRIVE_API_VERSION,
  DRIVE_API_URL,
  DRIVE_UPLOAD_URL,
  SCREENSHOT_MIME_TYPES,
  GOOGLE_SLIDES_MIME_TYPE,
  GOOGLE_SHEETS_MIME_TYPE,
  XLSX_MIME_TYPE,
  DRIVE_REQUIRED_SCOPES,
} from "./types";

// Errors
export {
  DriveIntegrationError,
  DriveAuthError,
  DriveTokenExpiredError,
  DriveRateLimitError,
  DrivePermissionError,
  DriveFileNotFoundError,
  DriveFolderNotFoundError,
  DriveUploadError,
  DriveDownloadError,
} from "./errors";
