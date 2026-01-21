/**
 * Report Generation Types
 */

/**
 * Date period for reports
 */
export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
  label: string; // e.g., "December 2025"
}

/**
 * Platform identifiers
 */
export type Platform = "meta" | "ga4" | "equals5";

/**
 * Unified metrics across all platforms
 */
export interface UnifiedMetrics {
  // Spend
  spend?: number;
  budget?: number;

  // Impressions/Reach
  impressions: number;
  reach: number;

  // Engagement
  clicks: number;
  ctr: number;

  // Platform-specific can be stored here
  platformSpecific?: Record<string, unknown>;
}

/**
 * Platform-specific data with unified structure
 */
export interface PlatformData {
  platform: Platform;
  period: ReportPeriod;
  metrics: UnifiedMetrics;
  campaigns?: CampaignMetrics[];
  fetchedAt: Date;
}

/**
 * Campaign-level metrics
 */
export interface CampaignMetrics {
  id: string;
  name: string;
  status: string;
  metrics: UnifiedMetrics;
}

/**
 * Aggregated data for a client
 */
export interface ClientReportData {
  clientId: string;
  clientName: string;
  period: ReportPeriod;
  previousPeriod?: ReportPeriod;

  // Platform data
  platforms: {
    meta?: PlatformData;
    ga4?: PlatformData;
    equals5?: PlatformData;
  };

  // Aggregated metrics
  totals: AggregatedMetrics;

  // Month-over-month comparison
  comparison?: MetricsComparison;

  // Screenshots
  screenshots?: ScreenshotData[];

  // Generated at
  generatedAt: Date;
}

/**
 * Aggregated metrics across platforms
 */
export interface AggregatedMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  overallCtr: number;

  // Platform breakdown
  byPlatform: {
    platform: Platform;
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    ctr: number;
    percentOfTotal: number;
  }[];
}

/**
 * Month-over-month comparison
 */
export interface MetricsComparison {
  currentPeriod: ReportPeriod;
  previousPeriod: ReportPeriod;

  // Changes
  spendChange: PercentChange;
  impressionsChange: PercentChange;
  reachChange: PercentChange;
  clicksChange: PercentChange;
  ctrChange: PercentChange;

  // Platform-specific changes
  byPlatform: {
    platform: Platform;
    spendChange: PercentChange;
    impressionsChange: PercentChange;
    clicksChange: PercentChange;
  }[];
}

/**
 * Percent change calculation
 */
export interface PercentChange {
  current: number;
  previous: number;
  change: number; // Absolute change
  percentChange: number; // Percentage change
  direction: "up" | "down" | "unchanged";
}

/**
 * Screenshot data for reports
 */
export interface ScreenshotData {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
}

/**
 * Report template configuration
 */
export interface ReportTemplate {
  id: string;
  name: string;
  type: "slides" | "xlsx";
  googleSlidesId?: string;
  sections: TemplateSection[];
}

/**
 * Template section configuration
 */
export interface TemplateSection {
  id: string;
  name: string;
  type: "executive_summary" | "spend_overview" | "performance" | "platform_breakdown" | "campaign_details" | "screenshots";
  placeholders: TemplatePlaceholder[];
}

/**
 * Template placeholder
 */
export interface TemplatePlaceholder {
  key: string; // e.g., "{{TOTAL_SPEND}}"
  type: "text" | "number" | "currency" | "percent" | "chart" | "image";
  format?: string; // e.g., "$0,0.00" for currency
  source: string; // Path to data, e.g., "totals.totalSpend"
}

/**
 * Generated report
 */
export interface GeneratedReport {
  id: string;
  clientId: string;
  period: ReportPeriod;
  type: "slides" | "xlsx";
  status: "draft" | "in_review" | "approved" | "delivered";
  fileId?: string; // Google Drive file ID
  fileUrl?: string;
  generatedAt: Date;
  generatedBy: string;
}

/**
 * Chart data for reports
 */
export interface ChartData {
  type: "bar" | "line" | "pie" | "donut";
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

/**
 * Executive summary content
 */
export interface ExecutiveSummary {
  highlights: string[];
  keyMetrics: {
    label: string;
    value: string;
    change?: string;
    trend?: "up" | "down" | "neutral";
  }[];
  recommendations?: string[];
  customContent?: string; // Manual editor content
}
