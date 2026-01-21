// Re-export Prisma types
export type {
  User,
  Client,
  Credential,
  MetaAdsData,
  GAData,
  Equals5Data,
  Report,
  ReportStatusHistory,
  Template,
  UserRole,
  ClientStatus,
  ReportStatus,
  ExtractionStatus,
} from "@prisma/client";

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Date range for data fetching
export interface DateRange {
  start: Date;
  end: Date;
}

// Aggregated metrics for reports
export interface AggregatedMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  ctr: number;

  // Period comparison
  previousPeriod?: {
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    ctr: number;
  };

  // Month-over-month changes
  momChange?: {
    spend: number;
    spendPercent: number;
    impressions: number;
    impressionsPercent: number;
    clicks: number;
    clicksPercent: number;
  };

  // Platform breakdown
  byPlatform?: {
    meta?: PlatformMetrics;
    ga?: PlatformMetrics;
    equals5?: PlatformMetrics;
  };
}

export interface PlatformMetrics {
  spend?: number;
  impressions?: number;
  reach?: number;
  clicks?: number;
  sessions?: number;
  users?: number;
  conversions?: number;
}

// Equals 5 credentials (decrypted)
export interface Equals5Credentials {
  username: string;
  password: string;
  mfaSecret?: string;
}
