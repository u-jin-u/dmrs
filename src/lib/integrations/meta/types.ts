/**
 * Meta Ads Integration Types
 */

// Meta API Configuration
export interface MetaConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

// OAuth Token Response
export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

// Long-lived Token Response
export interface MetaLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // Usually 60 days
}

// Ad Account
export interface MetaAdAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number;
}

// Insights Request Parameters
export interface MetaInsightsParams {
  adAccountId: string;
  dateStart: Date;
  dateEnd: Date;
  fields?: string[];
  level?: "account" | "campaign" | "adset" | "ad";
}

// Insights Response from API
export interface MetaInsightsResponse {
  data: MetaInsight[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

// Single Insight Record
export interface MetaInsight {
  account_id?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend: string;
  impressions: string;
  reach: string;
  clicks: string;
  ctr: string;
  cpc?: string;
  cpm?: string;
  date_start: string;
  date_stop: string;
}

// Processed/Normalized Data
export interface MetaAdsData {
  accountId: string;
  dateStart: Date;
  dateEnd: Date;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  campaigns: CampaignData[];
  fetchedAt: Date;
}

export interface CampaignData {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
}

// Error Types
export interface MetaApiError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export interface MetaErrorResponse {
  error: MetaApiError;
}

// Default fields to request
export const DEFAULT_INSIGHT_FIELDS = [
  "spend",
  "impressions",
  "reach",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
] as const;

// API Constants
export const META_API_VERSION = "v18.0";
export const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;
