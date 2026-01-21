/**
 * Google Integrations
 *
 * Unified exports for Google Analytics and Google Drive
 */

// Shared config type (same for both)
export type { GoogleConfig } from "./analytics/types";

// Google Analytics
export {
  GA4Client,
  GA4ApiError,
  GA4Service,
  getGA4Service,
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  validateToken,
  isTokenValid,
  completeOAuthFlow,
  ensureValidToken,
  revokeToken,
  GA4_REQUIRED_SCOPES,
  GA4_OPTIONAL_SCOPES,
  GA4_API_VERSION,
  GA4_API_URL,
  DEFAULT_GA4_METRICS,
  PAGE_METRICS,
  SOURCE_METRICS,
  GA4IntegrationError,
  GA4AuthError,
  GA4TokenExpiredError,
  GA4RefreshTokenError,
  GA4RateLimitError,
  GA4PermissionError,
  GA4DataFetchError,
  GA4PropertyNotFoundError,
} from "./analytics";

export type {
  GA4Credential,
  FetchResult as GA4FetchResult,
  TokenInfo,
  GA4Property,
  DateRange,
  Dimension,
  Metric,
  GA4ReportRequest,
  GA4ReportResponse,
  GA4Row,
  GA4Data,
  PageData,
  SourceData,
  GoogleTokenResponse,
  GoogleErrorResponse,
  GA4ErrorResponse,
} from "./analytics";

// Google Drive
export {
  DriveClient,
  DriveApiError,
  DriveService,
  getDriveService,
  DRIVE_API_VERSION,
  DRIVE_API_URL,
  DRIVE_UPLOAD_URL,
  SCREENSHOT_MIME_TYPES,
  GOOGLE_SLIDES_MIME_TYPE,
  GOOGLE_SHEETS_MIME_TYPE,
  XLSX_MIME_TYPE,
  DRIVE_REQUIRED_SCOPES,
  DriveIntegrationError,
  DriveAuthError,
  DriveTokenExpiredError,
  DriveRateLimitError,
  DrivePermissionError,
  DriveFileNotFoundError,
  DriveFolderNotFoundError,
  DriveUploadError,
  DriveDownloadError,
} from "./drive";

export type {
  DriveCredential,
  ClientFolders,
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
} from "./drive";
