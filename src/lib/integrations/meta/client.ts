/**
 * Meta Ads API Client
 */

import {
  MetaConfig,
  MetaAdAccount,
  MetaInsightsParams,
  MetaInsightsResponse,
  MetaInsight,
  MetaAdsData,
  CampaignData,
  MetaErrorResponse,
  META_GRAPH_URL,
  DEFAULT_INSIGHT_FIELDS,
} from "./types";

export class MetaAdsClient {
  private accessToken: string;
  private config: MetaConfig;

  constructor(accessToken: string, config?: Partial<MetaConfig>) {
    this.accessToken = accessToken;
    this.config = {
      appId: process.env.META_APP_ID || "",
      appSecret: process.env.META_APP_SECRET || "",
      redirectUri: process.env.META_REDIRECT_URI || "",
      ...config,
    };
  }

  /**
   * Make a request to the Meta Graph API
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const url = new URL(`${META_GRAPH_URL}${endpoint}`);
    url.searchParams.set("access_token", this.accessToken);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      const errorData = data as MetaErrorResponse;
      throw new MetaApiError(
        errorData.error?.message || "Unknown Meta API error",
        errorData.error?.code || response.status,
        errorData.error?.type
      );
    }

    return data as T;
  }

  /**
   * Get ad accounts accessible by the current token
   */
  async getAdAccounts(): Promise<MetaAdAccount[]> {
    const response = await this.request<{ data: MetaAdAccount[] }>("/me/adaccounts", {
      fields: "id,account_id,name,currency,timezone_name,account_status",
    });

    return response.data;
  }

  /**
   * Get insights for a specific ad account
   */
  async getAccountInsights(params: MetaInsightsParams): Promise<MetaInsightsResponse> {
    const { adAccountId, dateStart, dateEnd, fields, level } = params;

    const timeRange = JSON.stringify({
      since: formatDate(dateStart),
      until: formatDate(dateEnd),
    });

    const requestParams: Record<string, string> = {
      fields: (fields || DEFAULT_INSIGHT_FIELDS).join(","),
      time_range: timeRange,
      time_increment: "all_days", // Aggregate for the entire period
    };

    if (level) {
      requestParams.level = level;
    }

    return this.request<MetaInsightsResponse>(
      `/act_${adAccountId}/insights`,
      requestParams
    );
  }

  /**
   * Get campaign-level insights
   */
  async getCampaignInsights(params: MetaInsightsParams): Promise<MetaInsightsResponse> {
    return this.getAccountInsights({
      ...params,
      level: "campaign",
      fields: [
        ...DEFAULT_INSIGHT_FIELDS,
        "campaign_id",
        "campaign_name",
      ],
    });
  }

  /**
   * Fetch and process all data for a client's ad account
   */
  async fetchData(
    adAccountId: string,
    dateStart: Date,
    dateEnd: Date
  ): Promise<MetaAdsData> {
    // Fetch account-level insights
    const accountInsights = await this.getAccountInsights({
      adAccountId,
      dateStart,
      dateEnd,
    });

    // Fetch campaign-level insights
    const campaignInsights = await this.getCampaignInsights({
      adAccountId,
      dateStart,
      dateEnd,
    });

    // Process account-level data
    const accountData = accountInsights.data[0] || {
      spend: "0",
      impressions: "0",
      reach: "0",
      clicks: "0",
      ctr: "0",
    };

    // Process campaign-level data
    const campaigns: CampaignData[] = campaignInsights.data.map((insight) => ({
      campaignId: insight.campaign_id || "",
      campaignName: insight.campaign_name || "",
      spend: parseFloat(insight.spend) || 0,
      impressions: parseInt(insight.impressions) || 0,
      reach: parseInt(insight.reach) || 0,
      clicks: parseInt(insight.clicks) || 0,
      ctr: parseFloat(insight.ctr) || 0,
    }));

    return {
      accountId: adAccountId,
      dateStart,
      dateEnd,
      spend: parseFloat(accountData.spend) || 0,
      impressions: parseInt(accountData.impressions) || 0,
      reach: parseInt(accountData.reach) || 0,
      clicks: parseInt(accountData.clicks) || 0,
      ctr: parseFloat(accountData.ctr) || 0,
      campaigns,
      fetchedAt: new Date(),
    };
  }
}

/**
 * Custom error for Meta API errors
 */
export class MetaApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public type?: string
  ) {
    super(message);
    this.name = "MetaApiError";
  }

  /**
   * Check if this is a rate limit error
   */
  isRateLimited(): boolean {
    return this.code === 17 || this.code === 4 || this.code === 32;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    return this.code === 190;
  }

  /**
   * Check if permissions are insufficient
   */
  isPermissionError(): boolean {
    return this.code === 10 || this.code === 200 || this.code === 294;
  }
}

/**
 * Format date as YYYY-MM-DD for Meta API
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
