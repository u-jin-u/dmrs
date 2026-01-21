/**
 * Google Analytics 4 Data API Types
 */

export const GA4_API_VERSION = "v1beta";
export const GA4_API_URL = `https://analyticsdata.googleapis.com/${GA4_API_VERSION}`;

/**
 * Google OAuth configuration
 */
export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * GA4 Property representation
 */
export interface GA4Property {
  name: string; // Format: properties/123456789
  propertyId: string;
  displayName: string;
  timeZone: string;
  currencyCode: string;
}

/**
 * Date range for reports
 */
export interface DateRange {
  startDate: string; // YYYY-MM-DD or relative: "yesterday", "7daysAgo"
  endDate: string;
}

/**
 * Dimension specification
 */
export interface Dimension {
  name: string;
}

/**
 * Metric specification
 */
export interface Metric {
  name: string;
}

/**
 * Report request parameters
 */
export interface GA4ReportRequest {
  propertyId: string;
  dateRanges: DateRange[];
  dimensions?: Dimension[];
  metrics: Metric[];
  limit?: number;
  offset?: number;
  orderBys?: OrderBy[];
  dimensionFilter?: FilterExpression;
  metricFilter?: FilterExpression;
}

/**
 * Ordering specification
 */
export interface OrderBy {
  dimension?: { dimensionName: string };
  metric?: { metricName: string };
  desc?: boolean;
}

/**
 * Filter expression
 */
export interface FilterExpression {
  filter?: Filter;
  andGroup?: { expressions: FilterExpression[] };
  orGroup?: { expressions: FilterExpression[] };
  notExpression?: FilterExpression;
}

/**
 * Individual filter
 */
export interface Filter {
  fieldName: string;
  stringFilter?: {
    matchType: "EXACT" | "BEGINS_WITH" | "ENDS_WITH" | "CONTAINS" | "FULL_REGEXP" | "PARTIAL_REGEXP";
    value: string;
    caseSensitive?: boolean;
  };
  inListFilter?: {
    values: string[];
    caseSensitive?: boolean;
  };
  numericFilter?: {
    operation: "EQUAL" | "LESS_THAN" | "LESS_THAN_OR_EQUAL" | "GREATER_THAN" | "GREATER_THAN_OR_EQUAL";
    value: { int64Value?: string; doubleValue?: number };
  };
  betweenFilter?: {
    fromValue: { int64Value?: string; doubleValue?: number };
    toValue: { int64Value?: string; doubleValue?: number };
  };
}

/**
 * Report response
 */
export interface GA4ReportResponse {
  dimensionHeaders?: Array<{ name: string }>;
  metricHeaders?: Array<{ name: string; type: string }>;
  rows?: GA4Row[];
  rowCount?: number;
  metadata?: {
    currencyCode: string;
    timeZone: string;
  };
}

/**
 * Report row
 */
export interface GA4Row {
  dimensionValues?: Array<{ value: string }>;
  metricValues?: Array<{ value: string }>;
}

/**
 * Processed GA4 data for storage
 */
export interface GA4Data {
  propertyId: string;
  dateStart: Date;
  dateEnd: Date;
  sessions: number;
  users: number;
  newUsers: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  eventsPerSession: number;
  engagementRate: number;
  topPages: PageData[];
  topSources: SourceData[];
  fetchedAt: Date;
}

/**
 * Page performance data
 */
export interface PageData {
  pagePath: string;
  pageTitle: string;
  pageviews: number;
  uniquePageviews: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

/**
 * Traffic source data
 */
export interface SourceData {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  newUsers: number;
  bounceRate: number;
}

/**
 * Google OAuth token response
 */
export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

/**
 * Google OAuth error response
 */
export interface GoogleErrorResponse {
  error: string;
  error_description?: string;
}

/**
 * GA4 API error response
 */
export interface GA4ErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
    details?: Array<{
      "@type": string;
      reason?: string;
      domain?: string;
      metadata?: Record<string, string>;
    }>;
  };
}

/**
 * Default metrics for fetching
 */
export const DEFAULT_GA4_METRICS = [
  "sessions",
  "totalUsers",
  "newUsers",
  "screenPageViews",
  "bounceRate",
  "averageSessionDuration",
  "eventsPerSession",
  "engagementRate",
] as const;

/**
 * Page performance metrics
 */
export const PAGE_METRICS = [
  "screenPageViews",
  "sessions",
  "averageSessionDuration",
  "bounceRate",
] as const;

/**
 * Source/medium metrics
 */
export const SOURCE_METRICS = [
  "sessions",
  "totalUsers",
  "newUsers",
  "bounceRate",
] as const;
