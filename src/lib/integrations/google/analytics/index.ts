/**
 * Google Analytics 4 Integration
 *
 * Public API for GA4 data fetching
 */

// Client
export { GA4Client, GA4ApiError } from "./client";

// Service
export {
  GA4Service,
  getGA4Service,
  type GA4Credential,
  type FetchResult,
} from "./service";

// Auth
export {
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
  type TokenInfo,
} from "./auth";

// Types
export type {
  GoogleConfig,
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
} from "./types";

export {
  GA4_API_VERSION,
  GA4_API_URL,
  DEFAULT_GA4_METRICS,
  PAGE_METRICS,
  SOURCE_METRICS,
} from "./types";

// Errors
export {
  GA4IntegrationError,
  GA4AuthError,
  GA4TokenExpiredError,
  GA4RefreshTokenError,
  GA4RateLimitError,
  GA4PermissionError,
  GA4DataFetchError,
  GA4PropertyNotFoundError,
} from "./errors";
