/**
 * XLSX Report Generator
 *
 * Generates Excel reports from aggregated data
 */

import * as XLSX from "xlsx";
import {
  ClientReportData,
  ExecutiveSummary,
  Platform,
} from "./types";
import { formatMetricsForDisplay, buildPerformanceIndicators } from "./charts";

/**
 * Platform display names
 */
const PLATFORM_NAMES: Record<Platform, string> = {
  meta: "Meta Ads",
  ga4: "Google Analytics",
  equals5: "Equals 5",
};

/**
 * Generate XLSX report
 */
export function generateXlsxReport(
  data: ClientReportData,
  summary?: ExecutiveSummary
): Buffer {
  const workbook = XLSX.utils.book_new();

  // Add sheets
  addSummarySheet(workbook, data, summary);
  addMetricsSheet(workbook, data);
  addPlatformBreakdownSheet(workbook, data);

  if (data.comparison) {
    addComparisonSheet(workbook, data);
  }

  addCampaignDetailsSheet(workbook, data);

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

/**
 * Add summary sheet
 */
function addSummarySheet(
  workbook: XLSX.WorkBook,
  data: ClientReportData,
  summary?: ExecutiveSummary
): void {
  const rows: (string | number)[][] = [];

  // Header
  rows.push(["MARKETING REPORT"]);
  rows.push([data.clientName]);
  rows.push([data.period.label]);
  rows.push([`Generated: ${data.generatedAt.toLocaleDateString()}`]);
  rows.push([]);

  // Key Metrics
  rows.push(["KEY METRICS"]);
  rows.push(["Metric", "Value"]);

  const formatted = formatMetricsForDisplay(data.totals);
  rows.push(["Total Spend", formatted.totalSpend]);
  rows.push(["Total Impressions", formatted.totalImpressions]);
  rows.push(["Total Reach", formatted.totalReach]);
  rows.push(["Total Clicks", formatted.totalClicks]);
  rows.push(["Overall CTR", formatted.overallCtr]);
  rows.push([]);

  // Executive Summary
  if (summary) {
    rows.push(["EXECUTIVE SUMMARY"]);
    rows.push([]);

    if (summary.highlights.length > 0) {
      rows.push(["Highlights:"]);
      for (const highlight of summary.highlights) {
        rows.push([`• ${highlight}`]);
      }
      rows.push([]);
    }

    if (summary.recommendations && summary.recommendations.length > 0) {
      rows.push(["Recommendations:"]);
      for (const rec of summary.recommendations) {
        rows.push([`• ${rec}`]);
      }
    }
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Summary");
}

/**
 * Add metrics overview sheet
 */
function addMetricsSheet(workbook: XLSX.WorkBook, data: ClientReportData): void {
  const rows: (string | number)[][] = [];

  rows.push(["METRICS OVERVIEW"]);
  rows.push([]);
  rows.push(["Metric", "Value", "Notes"]);
  rows.push([]);

  // Spend
  rows.push(["SPEND"]);
  rows.push(["Total Spend", data.totals.totalSpend, "All platforms combined"]);
  rows.push([]);

  // Impressions & Reach
  rows.push(["IMPRESSIONS & REACH"]);
  rows.push(["Total Impressions", data.totals.totalImpressions, ""]);
  rows.push(["Total Reach", data.totals.totalReach, ""]);
  rows.push([]);

  // Engagement
  rows.push(["ENGAGEMENT"]);
  rows.push(["Total Clicks", data.totals.totalClicks, ""]);
  rows.push(["Overall CTR", `${data.totals.overallCtr.toFixed(2)}%`, ""]);

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Metrics");
}

/**
 * Add platform breakdown sheet
 */
function addPlatformBreakdownSheet(
  workbook: XLSX.WorkBook,
  data: ClientReportData
): void {
  const rows: (string | number)[][] = [];

  rows.push(["PLATFORM BREAKDOWN"]);
  rows.push([]);
  rows.push([
    "Platform",
    "Spend",
    "Impressions",
    "Reach",
    "Clicks",
    "CTR",
    "% of Total",
  ]);

  for (const platform of data.totals.byPlatform) {
    rows.push([
      PLATFORM_NAMES[platform.platform],
      platform.spend,
      platform.impressions,
      platform.reach,
      platform.clicks,
      `${platform.ctr.toFixed(2)}%`,
      `${platform.percentOfTotal.toFixed(1)}%`,
    ]);
  }

  rows.push([]);
  rows.push([
    "TOTAL",
    data.totals.totalSpend,
    data.totals.totalImpressions,
    data.totals.totalReach,
    data.totals.totalClicks,
    `${data.totals.overallCtr.toFixed(2)}%`,
    "100%",
  ]);

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Platform Breakdown");
}

/**
 * Add month-over-month comparison sheet
 */
function addComparisonSheet(
  workbook: XLSX.WorkBook,
  data: ClientReportData
): void {
  if (!data.comparison) return;

  const rows: (string | number)[][] = [];

  rows.push(["MONTH-OVER-MONTH COMPARISON"]);
  rows.push([`${data.period.label} vs ${data.previousPeriod?.label}`]);
  rows.push([]);

  rows.push(["Metric", "Current", "Previous", "Change", "% Change"]);

  const indicators = buildPerformanceIndicators(data.comparison);

  for (const indicator of indicators) {
    let previousValue = "";
    if (indicator.metric === "Total Spend") {
      previousValue = `$${data.comparison.spendChange.previous.toLocaleString()}`;
    } else if (indicator.metric === "CTR") {
      previousValue = `${data.comparison.ctrChange.previous.toFixed(2)}%`;
    } else if (indicator.metric === "Impressions") {
      previousValue = data.comparison.impressionsChange.previous.toLocaleString();
    } else if (indicator.metric === "Reach") {
      previousValue = data.comparison.reachChange.previous.toLocaleString();
    } else if (indicator.metric === "Clicks") {
      previousValue = data.comparison.clicksChange.previous.toLocaleString();
    }

    rows.push([
      indicator.metric,
      indicator.current,
      previousValue,
      indicator.change,
      indicator.direction === "up" ? "↑" : indicator.direction === "down" ? "↓" : "→",
    ]);
  }

  rows.push([]);
  rows.push(["PLATFORM-SPECIFIC CHANGES"]);
  rows.push([]);
  rows.push(["Platform", "Spend Change", "Impressions Change", "Clicks Change"]);

  for (const platformChange of data.comparison.byPlatform) {
    rows.push([
      PLATFORM_NAMES[platformChange.platform],
      `${platformChange.spendChange.percentChange >= 0 ? "+" : ""}${platformChange.spendChange.percentChange.toFixed(1)}%`,
      `${platformChange.impressionsChange.percentChange >= 0 ? "+" : ""}${platformChange.impressionsChange.percentChange.toFixed(1)}%`,
      `${platformChange.clicksChange.percentChange >= 0 ? "+" : ""}${platformChange.clicksChange.percentChange.toFixed(1)}%`,
    ]);
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "MoM Comparison");
}

/**
 * Add campaign details sheet
 */
function addCampaignDetailsSheet(
  workbook: XLSX.WorkBook,
  data: ClientReportData
): void {
  const rows: (string | number)[][] = [];

  rows.push(["CAMPAIGN DETAILS"]);
  rows.push([]);

  // Collect all campaigns from all platforms
  const allCampaigns: Array<{
    platform: string;
    name: string;
    status: string;
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    ctr: string;
  }> = [];

  for (const [platform, platformData] of Object.entries(data.platforms)) {
    if (!platformData?.campaigns) continue;

    for (const campaign of platformData.campaigns) {
      allCampaigns.push({
        platform: PLATFORM_NAMES[platform as Platform],
        name: campaign.name,
        status: campaign.status,
        spend: campaign.metrics.spend || 0,
        impressions: campaign.metrics.impressions,
        reach: campaign.metrics.reach,
        clicks: campaign.metrics.clicks,
        ctr: `${campaign.metrics.ctr.toFixed(2)}%`,
      });
    }
  }

  if (allCampaigns.length > 0) {
    rows.push([
      "Platform",
      "Campaign Name",
      "Status",
      "Spend",
      "Impressions",
      "Reach",
      "Clicks",
      "CTR",
    ]);

    for (const campaign of allCampaigns) {
      rows.push([
        campaign.platform,
        campaign.name,
        campaign.status,
        campaign.spend,
        campaign.impressions,
        campaign.reach,
        campaign.clicks,
        campaign.ctr,
      ]);
    }
  } else {
    rows.push(["No campaign-level data available"]);
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Campaign Details");
}

/**
 * Save XLSX to file
 */
export function saveXlsxToFile(buffer: Buffer, filePath: string): void {
  const fs = require("fs");
  fs.writeFileSync(filePath, buffer);
}
