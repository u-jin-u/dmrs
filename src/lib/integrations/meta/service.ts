/**
 * Meta Ads Service Layer
 *
 * High-level service for fetching and storing Meta Ads data
 */

import { MetaAdsClient, MetaApiError } from "./client";
import { MetaAdsData, MetaAdAccount, MetaConfig } from "./types";
import {
  MetaDataFetchError,
  MetaTokenExpiredError,
  MetaRateLimitError,
  MetaPermissionError,
} from "./errors";
import { isTokenValid } from "./auth";

export interface MetaCredential {
  accessToken: string;
  adAccountId: string;
  expiresAt: Date;
}

export interface FetchResult {
  success: boolean;
  data?: MetaAdsData;
  error?: string;
  needsReauth?: boolean;
}

/**
 * Meta Ads Service for managing data fetching operations
 */
export class MetaAdsService {
  private config: MetaConfig;

  constructor(config?: Partial<MetaConfig>) {
    this.config = {
      appId: process.env.META_APP_ID || "",
      appSecret: process.env.META_APP_SECRET || "",
      redirectUri: process.env.META_REDIRECT_URI || "",
      ...config,
    };
  }

  /**
   * Create a client instance with the given access token
   */
  private createClient(accessToken: string): MetaAdsClient {
    return new MetaAdsClient(accessToken, this.config);
  }

  /**
   * Validate credentials before fetching
   */
  async validateCredential(credential: MetaCredential): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    // Check expiration
    if (credential.expiresAt < new Date()) {
      return { valid: false, reason: "Token expired" };
    }

    // Validate with Meta API
    const isValid = await isTokenValid(credential.accessToken, this.config);
    if (!isValid) {
      return { valid: false, reason: "Token is invalid or revoked" };
    }

    return { valid: true };
  }

  /**
   * Fetch ad accounts for a token
   */
  async getAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
    const client = this.createClient(accessToken);
    return client.getAdAccounts();
  }

  /**
   * Fetch Meta Ads data for a client
   */
  async fetchData(
    credential: MetaCredential,
    dateStart: Date,
    dateEnd: Date
  ): Promise<FetchResult> {
    try {
      // Validate credential first
      const validation = await this.validateCredential(credential);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.reason,
          needsReauth: true,
        };
      }

      // Create client and fetch data
      const client = this.createClient(credential.accessToken);
      const data = await client.fetchData(
        credential.adAccountId,
        dateStart,
        dateEnd
      );

      return {
        success: true,
        data,
      };
    } catch (error) {
      return this.handleFetchError(error, credential.adAccountId);
    }
  }

  /**
   * Fetch data for multiple clients
   */
  async fetchDataBatch(
    credentials: MetaCredential[],
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
          return { adAccountId: credential.adAccountId, result };
        })
      );

      for (const { adAccountId, result } of batchResults) {
        results.set(adAccountId, result);
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
  private handleFetchError(error: unknown, adAccountId: string): FetchResult {
    if (error instanceof MetaApiError) {
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
          error: "Insufficient permissions to access this ad account",
          needsReauth: true,
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    if (error instanceof MetaTokenExpiredError) {
      return {
        success: false,
        error: "Access token has expired",
        needsReauth: true,
      };
    }

    if (error instanceof MetaRateLimitError) {
      return {
        success: false,
        error: "Rate limit exceeded",
      };
    }

    if (error instanceof MetaPermissionError) {
      return {
        success: false,
        error: error.message,
        needsReauth: true,
      };
    }

    // Unknown error
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Meta Ads fetch error for ${adAccountId}:`, error);

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
let serviceInstance: MetaAdsService | null = null;

export function getMetaAdsService(config?: Partial<MetaConfig>): MetaAdsService {
  if (!serviceInstance) {
    serviceInstance = new MetaAdsService(config);
  }
  return serviceInstance;
}
