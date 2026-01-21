/**
 * Google OAuth Authentication for GA4
 */

import {
  GoogleConfig,
  GoogleTokenResponse,
  GoogleErrorResponse,
} from "./types";
import { GA4AuthError, GA4RefreshTokenError } from "./errors";

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Required OAuth scopes for GA4 Data API
 */
export const GA4_REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
] as const;

/**
 * Optional additional scopes
 */
export const GA4_OPTIONAL_SCOPES = [
  "https://www.googleapis.com/auth/analytics", // Full access
  "https://www.googleapis.com/auth/analytics.edit", // Edit access
] as const;

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(
  config: GoogleConfig,
  state?: string,
  additionalScopes?: string[]
): string {
  const scopes = [...GA4_REQUIRED_SCOPES, ...(additionalScopes || [])];

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline", // Required to get refresh_token
    prompt: "consent", // Force consent to get refresh_token
  });

  if (state) {
    params.set("state", state);
  }

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForToken(
  code: string,
  config: GoogleConfig
): Promise<GoogleTokenResponse> {
  const params = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as GoogleErrorResponse;
    throw new GA4AuthError(
      errorData.error_description || errorData.error || "Failed to exchange code for token",
      errorData.error
    );
  }

  return data as GoogleTokenResponse;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  config: GoogleConfig
): Promise<GoogleTokenResponse> {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as GoogleErrorResponse;
    throw new GA4RefreshTokenError(
      errorData.error_description || "Failed to refresh access token"
    );
  }

  return data as GoogleTokenResponse;
}

/**
 * Validate an access token
 */
export async function validateToken(accessToken: string): Promise<TokenInfo> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new GA4AuthError("Invalid or expired token");
  }

  return data as TokenInfo;
}

/**
 * Check if token is valid and not expired
 */
export async function isTokenValid(accessToken: string): Promise<boolean> {
  try {
    const tokenInfo = await validateToken(accessToken);
    return tokenInfo.expires_in > 0;
  } catch {
    return false;
  }
}

/**
 * Token info from Google
 */
export interface TokenInfo {
  azp: string;
  aud: string;
  scope: string;
  exp: string;
  expires_in: number;
  access_type: string;
}

/**
 * Complete OAuth flow: exchange code and prepare credentials
 */
export async function completeOAuthFlow(
  code: string,
  config: GoogleConfig
): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scopes: string[];
}> {
  const tokenResponse = await exchangeCodeForToken(code, config);

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || null,
    expiresAt,
    scopes: tokenResponse.scope.split(" "),
  };
}

/**
 * Refresh credentials if needed
 */
export async function ensureValidToken(
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date,
  config: GoogleConfig
): Promise<{
  accessToken: string;
  expiresAt: Date;
  refreshed: boolean;
}> {
  // Check if token is still valid (with 5 minute buffer)
  const now = new Date();
  const buffer = 5 * 60 * 1000; // 5 minutes

  if (expiresAt.getTime() - buffer > now.getTime()) {
    return { accessToken, expiresAt, refreshed: false };
  }

  // Token expired or expiring soon, refresh it
  if (!refreshToken) {
    throw new GA4AuthError("Token expired and no refresh token available");
  }

  const newTokens = await refreshAccessToken(refreshToken, config);

  const newExpiresAt = new Date();
  newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokens.expires_in);

  return {
    accessToken: newTokens.access_token,
    expiresAt: newExpiresAt,
    refreshed: true,
  };
}

/**
 * Revoke a token
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(
    `https://oauth2.googleapis.com/revoke?token=${token}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!response.ok) {
    throw new GA4AuthError("Failed to revoke token");
  }
}
