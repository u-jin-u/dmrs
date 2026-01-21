/**
 * Chart Data Preparation
 *
 * Prepares data for charts and visualizations in reports
 */

import {
  ChartData,
  ClientReportData,
  Platform,
  MetricsComparison,
  AggregatedMetrics,
} from "./types";

/**
 * Platform display names
 */
const PLATFORM_NAMES: Record<Platform, string> = {
  meta: "Meta Ads",
  ga4: "Google Analytics",
  equals5: "Equals 5",
};

/**
 * Platform colors
 */
const PLATFORM_COLORS: Record<Platform, string> = {
  meta: "#1877F2", // Facebook blue
  ga4: "#F9AB00", // Google yellow
  equals5: "#6366F1", // Indigo
};

/**
 * Build spend by platform pie chart
 */
export function buildSpendByPlatformChart(
  data: ClientReportData
): ChartData {
  const { byPlatform } = data.totals;

  const labels: string[] = [];
  const values: number[] = [];
  const colors: string[] = [];

  for (const platform of byPlatform) {
    if (platform.spend > 0) {
      labels.push(PLATFORM_NAMES[platform.platform]);
      values.push(platform.spend);
      colors.push(PLATFORM_COLORS[platform.platform]);
    }
  }

  return {
    type: "pie",
    title: "Spend by Platform",
    labels,
    datasets: [
      {
        label: "Spend",
        data: values,
        color: colors[0], // Primary color
      },
    ],
  };
}

/**
 * Build impressions by platform bar chart
 */
export function buildImpressionsByPlatformChart(
  data: ClientReportData
): ChartData {
  const { byPlatform } = data.totals;

  const labels: string[] = [];
  const values: number[] = [];

  for (const platform of byPlatform) {
    labels.push(PLATFORM_NAMES[platform.platform]);
    values.push(platform.impressions);
  }

  return {
    type: "bar",
    title: "Impressions by Platform",
    labels,
    datasets: [
      {
        label: "Impressions",
        data: values,
        color: "#3B82F6", // Blue
      },
    ],
  };
}

/**
 * Build month-over-month comparison chart
 */
export function buildMoMComparisonChart(
  data: ClientReportData
): ChartData | null {
  if (!data.comparison) return null;

  const { comparison } = data;
  const metrics = ["Spend", "Impressions", "Reach", "Clicks"];
  const currentValues = [
    comparison.spendChange.current,
    comparison.impressionsChange.current,
    comparison.reachChange.current,
    comparison.clicksChange.current,
  ];
  const previousValues = [
    comparison.spendChange.previous,
    comparison.impressionsChange.previous,
    comparison.reachChange.previous,
    comparison.clicksChange.previous,
  ];

  return {
    type: "bar",
    title: `${data.period.label} vs ${data.previousPeriod?.label}`,
    labels: metrics,
    datasets: [
      {
        label: data.period.label,
        data: currentValues,
        color: "#3B82F6", // Blue
      },
      {
        label: data.previousPeriod?.label || "Previous",
        data: previousValues,
        color: "#9CA3AF", // Gray
      },
    ],
  };
}

/**
 * Build CTR trend chart (if we have campaign data)
 */
export function buildCtrByPlatformChart(
  data: ClientReportData
): ChartData {
  const { byPlatform } = data.totals;

  const labels: string[] = [];
  const values: number[] = [];

  for (const platform of byPlatform) {
    labels.push(PLATFORM_NAMES[platform.platform]);
    values.push(Number(platform.ctr.toFixed(2)));
  }

  return {
    type: "bar",
    title: "Click-Through Rate by Platform",
    labels,
    datasets: [
      {
        label: "CTR %",
        data: values,
        color: "#10B981", // Green
      },
    ],
  };
}

/**
 * Build platform breakdown donut chart
 */
export function buildPlatformBreakdownChart(
  data: ClientReportData
): ChartData {
  const { byPlatform } = data.totals;

  const labels: string[] = [];
  const values: number[] = [];

  for (const platform of byPlatform) {
    labels.push(PLATFORM_NAMES[platform.platform]);
    values.push(Number(platform.percentOfTotal.toFixed(1)));
  }

  return {
    type: "donut",
    title: "Impression Share by Platform",
    labels,
    datasets: [
      {
        label: "Share %",
        data: values,
      },
    ],
  };
}

/**
 * Build performance change indicators
 */
export function buildPerformanceIndicators(
  comparison: MetricsComparison
): Array<{
  metric: string;
  current: string;
  change: string;
  direction: "up" | "down" | "unchanged";
  isPositive: boolean;
}> {
  const formatNumber = (n: number) => n.toLocaleString();
  const formatPercent = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
  const formatCurrency = (n: number) => `$${n.toLocaleString()}`;

  // For most metrics, "up" is positive. For spend, it depends on context
  return [
    {
      metric: "Total Spend",
      current: formatCurrency(comparison.spendChange.current),
      change: formatPercent(comparison.spendChange.percentChange),
      direction: comparison.spendChange.direction,
      isPositive: comparison.spendChange.direction === "down", // Lower spend is usually good
    },
    {
      metric: "Impressions",
      current: formatNumber(comparison.impressionsChange.current),
      change: formatPercent(comparison.impressionsChange.percentChange),
      direction: comparison.impressionsChange.direction,
      isPositive: comparison.impressionsChange.direction === "up",
    },
    {
      metric: "Reach",
      current: formatNumber(comparison.reachChange.current),
      change: formatPercent(comparison.reachChange.percentChange),
      direction: comparison.reachChange.direction,
      isPositive: comparison.reachChange.direction === "up",
    },
    {
      metric: "Clicks",
      current: formatNumber(comparison.clicksChange.current),
      change: formatPercent(comparison.clicksChange.percentChange),
      direction: comparison.clicksChange.direction,
      isPositive: comparison.clicksChange.direction === "up",
    },
    {
      metric: "CTR",
      current: `${comparison.ctrChange.current.toFixed(2)}%`,
      change: formatPercent(comparison.ctrChange.percentChange),
      direction: comparison.ctrChange.direction,
      isPositive: comparison.ctrChange.direction === "up",
    },
  ];
}

/**
 * Build all charts for a report
 */
export function buildAllCharts(data: ClientReportData): Record<string, ChartData | null> {
  return {
    spendByPlatform: buildSpendByPlatformChart(data),
    impressionsByPlatform: buildImpressionsByPlatformChart(data),
    momComparison: buildMoMComparisonChart(data),
    ctrByPlatform: buildCtrByPlatformChart(data),
    platformBreakdown: buildPlatformBreakdownChart(data),
  };
}

/**
 * Format metrics for display in reports
 */
export function formatMetricsForDisplay(totals: AggregatedMetrics): Record<string, string> {
  return {
    totalSpend: `$${totals.totalSpend.toLocaleString()}`,
    totalImpressions: totals.totalImpressions.toLocaleString(),
    totalReach: totals.totalReach.toLocaleString(),
    totalClicks: totals.totalClicks.toLocaleString(),
    overallCtr: `${totals.overallCtr.toFixed(2)}%`,
  };
}
