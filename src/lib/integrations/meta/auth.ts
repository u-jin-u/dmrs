/**
 * Meta OAuth Authentication
 */

import {
  MetaConfig,
  MetaTokenResponse,
  MetaLongLivedTokenResponse,
  META_GRAPH_URL,
} from "./types";
import { MetaAuthError } from "./errors";

const META_OAUTH_URL = "https://www.facebook.com/v18.0/dialog/oauth";

/**
 * Required permissions for Meta Ads API
 */
export const META_REQUIRED_SCOPES = [
  "ads_read",
  "ads_management",
  "business_management",
  "read_insights",
] as const;

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(config: MetaConfig, state?: string): string {
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    scope: META_REQUIRED_SCOPES.join(","),
    response_type: "code",
  });

  if (state) {
    params.set("state", state);
  }

  return `${META_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  config: MetaConfig
): Promise<MetaTokenResponse> {
  const params = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code,
  });

  const response = await fetch(
    `${META_GRAPH_URL}/oauth/access_token?${params.toString()}`
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new MetaAuthError(
      data.error?.message || "Failed to exchange code for token",
      data.error?.code,
      data.error?.error_description
    );
  }

  return data as MetaTokenResponse;
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
export async function getLongLivedToken(
  shortLivedToken: string,
  config: MetaConfig
): Promise<MetaLongLivedTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: config.appId,
    client_secret: config.appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(
    `${META_GRAPH_URL}/oauth/access_token?${params.toString()}`
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new MetaAuthError(
      data.error?.message || "Failed to get long-lived token",
      data.error?.code,
      data.error?.error_description
    );
  }

  return data as MetaLongLivedTokenResponse;
}

/**
 * Validate an access token and get debug info
 */
export async function debugToken(
  accessToken: string,
  config: MetaConfig
): Promise<TokenDebugInfo> {
  const params = new URLSearchParams({
    input_token: accessToken,
    access_token: `${config.appId}|${config.appSecret}`,
  });

  const response = await fetch(
    `${META_GRAPH_URL}/debug_token?${params.toString()}`
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new MetaAuthError(
      data.error?.message || "Failed to debug token",
      data.error?.code
    );
  }

  return data.data as TokenDebugInfo;
}

/**
 * Check if token is valid and not expired
 */
export async function isTokenValid(
  accessToken: string,
  config: MetaConfig
): Promise<boolean> {
  try {
    const debugInfo = await debugToken(accessToken, config);
    return debugInfo.is_valid && (!debugInfo.expires_at || debugInfo.expires_at > Date.now() / 1000);
  } catch {
    return false;
  }
}

/**
 * Token debug info from Meta API
 */
export interface TokenDebugInfo {
  app_id: string;
  type: string;
  application: string;
  data_access_expires_at: number;
  expires_at: number;
  is_valid: boolean;
  scopes: string[];
  user_id: string;
}

/**
 * Complete OAuth flow: exchange code and get long-lived token
 */
export async function completeOAuthFlow(
  code: string,
  config: MetaConfig
): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  // Exchange code for short-lived token
  const shortLivedResponse = await exchangeCodeForToken(code, config);

  // Exchange for long-lived token
  const longLivedResponse = await getLongLivedToken(
    shortLivedResponse.access_token,
    config
  );

  // Calculate expiration date (usually 60 days)
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + longLivedResponse.expires_in);

  return {
    accessToken: longLivedResponse.access_token,
    expiresAt,
  };
}
