/**
 * Data Aggregation Service
 *
 * Combines data from Meta Ads, Google Analytics, and Equals 5
 * into a unified format for report generation.
 */

import {
  Platform,
  PlatformData,
  UnifiedMetrics,
  AggregatedMetrics,
  ClientReportData,
  ReportPeriod,
  MetricsComparison,
  PercentChange,
  CampaignMetrics,
} from "./types";

import { MetaAdsData } from "../integrations/meta/types";
import { GA4Data } from "../integrations/google/analytics/types";
import { Equals5Data } from "../integrations/equals5/types";

/**
 * Convert Meta Ads data to unified format
 */
export function normalizeMetaData(
  data: MetaAdsData,
  period: ReportPeriod
): PlatformData {
  const campaigns: CampaignMetrics[] = data.campaigns.map((c) => ({
    id: c.campaignId,
    name: c.campaignName,
    status: "active", // Meta doesn't provide status in insights
    metrics: {
      spend: c.spend,
      impressions: c.impressions,
      reach: c.reach,
      clicks: c.clicks,
      ctr: c.ctr,
    },
  }));

  return {
    platform: "meta",
    period,
    metrics: {
      spend: data.spend,
      impressions: data.impressions,
      reach: data.reach,
      clicks: data.clicks,
      ctr: data.ctr,
    },
    campaigns,
    fetchedAt: data.fetchedAt,
  };
}

/**
 * Convert Google Analytics data to unified format
 */
export function normalizeGA4Data(
  data: GA4Data,
  period: ReportPeriod
): PlatformData {
  return {
    platform: "ga4",
    period,
    metrics: {
      impressions: data.pageviews, // Map pageviews to impressions concept
      reach: data.users,
      clicks: data.sessions, // Map sessions to engagement
      ctr: data.engagementRate * 100, // Convert to percentage
      platformSpecific: {
        sessions: data.sessions,
        newUsers: data.newUsers,
        bounceRate: data.bounceRate,
        avgSessionDuration: data.avgSessionDuration,
        topPages: data.topPages,
        topSources: data.topSources,
      },
    },
    fetchedAt: data.fetchedAt,
  };
}

/**
 * Convert Equals 5 data to unified format
 */
export function normalizeEquals5Data(
  data: Equals5Data,
  period: ReportPeriod
): PlatformData {
  return {
    platform: "equals5",
    period,
    metrics: {
      spend: data.spend,
      impressions: data.impressions || 0,
      reach: data.reach || 0,
      clicks: data.clicks || 0,
      ctr: data.avgCtr || 0,
      platformSpecific: {
        identifiedImpressions: data.identifiedImpressions,
        identifiedClicks: data.identifiedClicks,
        visitsMedia: data.visitsMedia,
        clicksMedia: data.clicksMedia,
        signals: data.signals,
      },
    },
    fetchedAt: data.extractedAt,
  };
}

/**
 * Aggregate metrics across all platforms
 */
export function aggregateMetrics(
  platforms: Partial<Record<Platform, PlatformData>>
): AggregatedMetrics {
  let totalSpend = 0;
  let totalImpressions = 0;
  let totalReach = 0;
  let totalClicks = 0;

  const byPlatform: AggregatedMetrics["byPlatform"] = [];

  // Process each platform
  for (const [platform, data] of Object.entries(platforms)) {
    if (!data) continue;

    const { metrics } = data;
    const spend = metrics.spend || 0;
    const impressions = metrics.impressions || 0;
    const reach = metrics.reach || 0;
    const clicks = metrics.clicks || 0;

    totalSpend += spend;
    totalImpressions += impressions;
    totalReach += reach;
    totalClicks += clicks;

    byPlatform.push({
      platform: platform as Platform,
      spend,
      impressions,
      reach,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      percentOfTotal: 0, // Will be calculated after totals
    });
  }

  // Calculate percentages of total
  for (const platformData of byPlatform) {
    platformData.percentOfTotal =
      totalImpressions > 0
        ? (platformData.impressions / totalImpressions) * 100
        : 0;
  }

  // Calculate overall CTR
  const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return {
    totalSpend,
    totalImpressions,
    totalReach,
    totalClicks,
    overallCtr,
    byPlatform,
  };
}

/**
 * Calculate percent change between two values
 */
export function calculatePercentChange(
  current: number,
  previous: number
): PercentChange {
  const change = current - previous;
  let percentChange = 0;

  if (previous !== 0) {
    percentChange = (change / previous) * 100;
  } else if (current > 0) {
    percentChange = 100; // From 0 to something is 100% increase
  }

  let direction: PercentChange["direction"] = "unchanged";
  if (change > 0) direction = "up";
  else if (change < 0) direction = "down";

  return {
    current,
    previous,
    change,
    percentChange,
    direction,
  };
}

/**
 * Calculate month-over-month comparison
 */
export function calculateComparison(
  currentData: Partial<Record<Platform, PlatformData>>,
  previousData: Partial<Record<Platform, PlatformData>>,
  currentPeriod: ReportPeriod,
  previousPeriod: ReportPeriod
): MetricsComparison {
  const currentTotals = aggregateMetrics(currentData);
  const previousTotals = aggregateMetrics(previousData);

  // Platform-specific changes
  const byPlatform: MetricsComparison["byPlatform"] = [];

  for (const platform of ["meta", "ga4", "equals5"] as Platform[]) {
    const current = currentData[platform]?.metrics;
    const previous = previousData[platform]?.metrics;

    if (current || previous) {
      byPlatform.push({
        platform,
        spendChange: calculatePercentChange(
          current?.spend || 0,
          previous?.spend || 0
        ),
        impressionsChange: calculatePercentChange(
          current?.impressions || 0,
          previous?.impressions || 0
        ),
        clicksChange: calculatePercentChange(
          current?.clicks || 0,
          previous?.clicks || 0
        ),
      });
    }
  }

  return {
    currentPeriod,
    previousPeriod,
    spendChange: calculatePercentChange(
      currentTotals.totalSpend,
      previousTotals.totalSpend
    ),
    impressionsChange: calculatePercentChange(
      currentTotals.totalImpressions,
      previousTotals.totalImpressions
    ),
    reachChange: calculatePercentChange(
      currentTotals.totalReach,
      previousTotals.totalReach
    ),
    clicksChange: calculatePercentChange(
      currentTotals.totalClicks,
      previousTotals.totalClicks
    ),
    ctrChange: calculatePercentChange(
      currentTotals.overallCtr,
      previousTotals.overallCtr
    ),
    byPlatform,
  };
}

/**
 * Build complete client report data
 */
export function buildClientReportData(options: {
  clientId: string;
  clientName: string;
  period: ReportPeriod;
  previousPeriod?: ReportPeriod;
  metaData?: MetaAdsData;
  ga4Data?: GA4Data;
  equals5Data?: Equals5Data;
  previousMetaData?: MetaAdsData;
  previousGA4Data?: GA4Data;
  previousEquals5Data?: Equals5Data;
}): ClientReportData {
  const {
    clientId,
    clientName,
    period,
    previousPeriod,
    metaData,
    ga4Data,
    equals5Data,
    previousMetaData,
    previousGA4Data,
    previousEquals5Data,
  } = options;

  // Normalize current period data
  const platforms: ClientReportData["platforms"] = {};

  if (metaData) {
    platforms.meta = normalizeMetaData(metaData, period);
  }
  if (ga4Data) {
    platforms.ga4 = normalizeGA4Data(ga4Data, period);
  }
  if (equals5Data) {
    platforms.equals5 = normalizeEquals5Data(equals5Data, period);
  }

  // Calculate totals
  const totals = aggregateMetrics(platforms);

  // Calculate comparison if previous period data available
  let comparison: MetricsComparison | undefined;

  if (previousPeriod && (previousMetaData || previousGA4Data || previousEquals5Data)) {
    const previousPlatforms: Partial<Record<Platform, PlatformData>> = {};

    if (previousMetaData) {
      previousPlatforms.meta = normalizeMetaData(previousMetaData, previousPeriod);
    }
    if (previousGA4Data) {
      previousPlatforms.ga4 = normalizeGA4Data(previousGA4Data, previousPeriod);
    }
    if (previousEquals5Data) {
      previousPlatforms.equals5 = normalizeEquals5Data(previousEquals5Data, previousPeriod);
    }

    comparison = calculateComparison(
      platforms,
      previousPlatforms,
      period,
      previousPeriod
    );
  }

  return {
    clientId,
    clientName,
    period,
    previousPeriod,
    platforms,
    totals,
    comparison,
    generatedAt: new Date(),
  };
}

/**
 * Get period for a specific month
 */
export function getMonthPeriod(year: number, month: number): ReportPeriod {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // Last day of month

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return {
    startDate,
    endDate,
    label: `${monthNames[month]} ${year}`,
  };
}

/**
 * Get previous month period
 */
export function getPreviousMonthPeriod(period: ReportPeriod): ReportPeriod {
  const date = new Date(period.startDate);
  date.setMonth(date.getMonth() - 1);
  return getMonthPeriod(date.getFullYear(), date.getMonth());
}
