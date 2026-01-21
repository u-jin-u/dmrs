/**
 * Google Analytics 4 Service Layer
 *
 * High-level service for fetching and storing GA4 data
 */

import { GA4Client, GA4ApiError } from "./client";
import { GA4Data, GA4Property, GoogleConfig } from "./types";
import {
  GA4DataFetchError,
  GA4TokenExpiredError,
  GA4RateLimitError,
  GA4PermissionError,
} from "./errors";
import { isTokenValid, ensureValidToken } from "./auth";

export interface GA4Credential {
  accessToken: string;
  refreshToken: string | null;
  propertyId: string;
  expiresAt: Date;
}

export interface FetchResult {
  success: boolean;
  data?: GA4Data;
  error?: string;
  needsReauth?: boolean;
  newAccessToken?: string;
  newExpiresAt?: Date;
}

/**
 * GA4 Service for managing data fetching operations
 */
export class GA4Service {
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
  private createClient(accessToken: string): GA4Client {
    return new GA4Client(accessToken, this.config);
  }

  /**
   * Validate and potentially refresh credentials
   */
  async validateCredential(credential: GA4Credential): Promise<{
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
   * Fetch available GA4 properties for a token
   */
  async getProperties(accessToken: string): Promise<GA4Property[]> {
    const client = this.createClient(accessToken);
    return client.getProperties();
  }

  /**
   * Fetch GA4 data for a client
   */
  async fetchData(
    credential: GA4Credential,
    dateStart: Date,
    dateEnd: Date
  ): Promise<FetchResult> {
    try {
      // Validate and refresh credential if needed
      const validation = await this.validateCredential(credential);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.reason,
          needsReauth: true,
        };
      }

      // Use refreshed token if available
      const accessToken = validation.newAccessToken || credential.accessToken;

      // Create client and fetch data
      const client = this.createClient(accessToken);
      const data = await client.fetchData(
        credential.propertyId,
        dateStart,
        dateEnd
      );

      return {
        success: true,
        data,
        newAccessToken: validation.newAccessToken,
        newExpiresAt: validation.newExpiresAt,
      };
    } catch (error) {
      return this.handleFetchError(error, credential.propertyId);
    }
  }

  /**
   * Fetch data for multiple clients
   */
  async fetchDataBatch(
    credentials: GA4Credential[],
    dateStart: Date,
    dateEnd: Date,
    options?: {
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<Map<string, FetchResult>> {
    const results = new Map<string, FetchResult>();
    const concurrency = options?.concurrency || 3;

    // Process in batches to avoid rate limiting
    for (let i = 0; i < credentials.length; i += concurrency) {
      const batch = credentials.slice(i, i + concurrency);

      const batchResults = await Promise.all(
        batch.map(async (credential) => {
          const result = await this.fetchData(credential, dateStart, dateEnd);
          return { propertyId: credential.propertyId, result };
        })
      );

      for (const { propertyId, result } of batchResults) {
        results.set(propertyId, result);
      }

      // Report progress
      options?.onProgress?.(
        Math.min(i + concurrency, credentials.length),
        credentials.length
      );

      // Add delay between batches to avoid rate limiting
      if (i + concurrency < credentials.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * Handle errors from fetch operations
   */
  private handleFetchError(error: unknown, propertyId: string): FetchResult {
    if (error instanceof GA4ApiError) {
      if (error.isTokenExpired()) {
        return {
          success: false,
          error: "Access token has expired",
          needsReauth: true,
        };
      }

      if (error.isRateLimited()) {
        return {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        };
      }

      if (error.isPermissionError()) {
        return {
          success: false,
          error: "Insufficient permissions to access this property",
          needsReauth: true,
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    if (error instanceof GA4TokenExpiredError) {
      return {
        success: false,
        error: "Access token has expired",
        needsReauth: true,
      };
    }

    if (error instanceof GA4RateLimitError) {
      return {
        success: false,
        error: "Rate limit exceeded",
      };
    }

    if (error instanceof GA4PermissionError) {
      return {
        success: false,
        error: error.message,
        needsReauth: true,
      };
    }

    // Unknown error
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`GA4 fetch error for ${propertyId}:`, error);

    return {
      success: false,
      error: message,
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a singleton service instance
 */
let serviceInstance: GA4Service | null = null;

export function getGA4Service(config?: Partial<GoogleConfig>): GA4Service {
  if (!serviceInstance) {
    serviceInstance = new GA4Service(config);
  }
  return serviceInstance;
}
