/**
 * Meta Ads Integration
 *
 * Public API for Meta Ads data fetching
 */

// Client
export { MetaAdsClient, MetaApiError } from "./client";

// Service
export {
  MetaAdsService,
  getMetaAdsService,
  type MetaCredential,
  type FetchResult,
} from "./service";

// Auth
export {
  getAuthorizationUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  completeOAuthFlow,
  debugToken,
  isTokenValid,
  META_REQUIRED_SCOPES,
  type TokenDebugInfo,
} from "./auth";

// Types
export type {
  MetaConfig,
  MetaAdAccount,
  MetaInsightsParams,
  MetaInsightsResponse,
  MetaInsight,
  MetaAdsData,
  CampaignData,
  MetaTokenResponse,
  MetaLongLivedTokenResponse,
  MetaErrorResponse,
} from "./types";

export {
  META_API_VERSION,
  META_GRAPH_URL,
  DEFAULT_INSIGHT_FIELDS,
} from "./types";

// Errors
export {
  MetaIntegrationError,
  MetaAuthError,
  MetaTokenExpiredError,
  MetaRateLimitError,
  MetaPermissionError,
  MetaDataFetchError,
} from "./errors";
