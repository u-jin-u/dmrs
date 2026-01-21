/**
 * Google Slides Report Generator
 *
 * Generates Google Slides reports from aggregated data
 */

import {
  ClientReportData,
  ExecutiveSummary,
  Platform,
  ScreenshotData,
  ReportTemplate,
  TemplatePlaceholder,
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
 * Placeholder value resolver
 */
type PlaceholderResolver = (data: ClientReportData, summary?: ExecutiveSummary) => string;

/**
 * Standard placeholder mappings
 */
const PLACEHOLDER_RESOLVERS: Record<string, PlaceholderResolver> = {
  // Client info
  "{{CLIENT_NAME}}": (data) => data.clientName,
  "{{PERIOD}}": (data) => data.period.label,
  "{{PREVIOUS_PERIOD}}": (data) => data.previousPeriod?.label || "N/A",
  "{{GENERATED_DATE}}": (data) => data.generatedAt.toLocaleDateString(),

  // Totals
  "{{TOTAL_SPEND}}": (data) => `$${data.totals.totalSpend.toLocaleString()}`,
  "{{TOTAL_IMPRESSIONS}}": (data) => data.totals.totalImpressions.toLocaleString(),
  "{{TOTAL_REACH}}": (data) => data.totals.totalReach.toLocaleString(),
  "{{TOTAL_CLICKS}}": (data) => data.totals.totalClicks.toLocaleString(),
  "{{OVERALL_CTR}}": (data) => `${data.totals.overallCtr.toFixed(2)}%`,

  // Changes (MoM)
  "{{SPEND_CHANGE}}": (data) =>
    data.comparison
      ? `${data.comparison.spendChange.percentChange >= 0 ? "+" : ""}${data.comparison.spendChange.percentChange.toFixed(1)}%`
      : "N/A",
  "{{IMPRESSIONS_CHANGE}}": (data) =>
    data.comparison
      ? `${data.comparison.impressionsChange.percentChange >= 0 ? "+" : ""}${data.comparison.impressionsChange.percentChange.toFixed(1)}%`
      : "N/A",
  "{{REACH_CHANGE}}": (data) =>
    data.comparison
      ? `${data.comparison.reachChange.percentChange >= 0 ? "+" : ""}${data.comparison.reachChange.percentChange.toFixed(1)}%`
      : "N/A",
  "{{CLICKS_CHANGE}}": (data) =>
    data.comparison
      ? `${data.comparison.clicksChange.percentChange >= 0 ? "+" : ""}${data.comparison.clicksChange.percentChange.toFixed(1)}%`
      : "N/A",
  "{{CTR_CHANGE}}": (data) =>
    data.comparison
      ? `${data.comparison.ctrChange.percentChange >= 0 ? "+" : ""}${data.comparison.ctrChange.percentChange.toFixed(1)}%`
      : "N/A",

  // Platform-specific: Meta
  "{{META_SPEND}}": (data) =>
    data.platforms.meta
      ? `$${(data.platforms.meta.metrics.spend || 0).toLocaleString()}`
      : "N/A",
  "{{META_IMPRESSIONS}}": (data) =>
    data.platforms.meta
      ? data.platforms.meta.metrics.impressions.toLocaleString()
      : "N/A",
  "{{META_REACH}}": (data) =>
    data.platforms.meta
      ? data.platforms.meta.metrics.reach.toLocaleString()
      : "N/A",
  "{{META_CLICKS}}": (data) =>
    data.platforms.meta
      ? data.platforms.meta.metrics.clicks.toLocaleString()
      : "N/A",
  "{{META_CTR}}": (data) =>
    data.platforms.meta
      ? `${data.platforms.meta.metrics.ctr.toFixed(2)}%`
      : "N/A",

  // Platform-specific: GA4
  "{{GA4_PAGEVIEWS}}": (data) =>
    data.platforms.ga4
      ? data.platforms.ga4.metrics.impressions.toLocaleString()
      : "N/A",
  "{{GA4_USERS}}": (data) =>
    data.platforms.ga4
      ? data.platforms.ga4.metrics.reach.toLocaleString()
      : "N/A",
  "{{GA4_SESSIONS}}": (data) =>
    data.platforms.ga4
      ? data.platforms.ga4.metrics.clicks.toLocaleString()
      : "N/A",
  "{{GA4_ENGAGEMENT_RATE}}": (data) =>
    data.platforms.ga4
      ? `${data.platforms.ga4.metrics.ctr.toFixed(2)}%`
      : "N/A",

  // Platform-specific: Equals 5
  "{{EQUALS5_SPEND}}": (data) =>
    data.platforms.equals5
      ? `$${(data.platforms.equals5.metrics.spend || 0).toLocaleString()}`
      : "N/A",
  "{{EQUALS5_IMPRESSIONS}}": (data) =>
    data.platforms.equals5
      ? data.platforms.equals5.metrics.impressions.toLocaleString()
      : "N/A",
  "{{EQUALS5_CLICKS}}": (data) =>
    data.platforms.equals5
      ? data.platforms.equals5.metrics.clicks.toLocaleString()
      : "N/A",
  "{{EQUALS5_CTR}}": (data) =>
    data.platforms.equals5
      ? `${data.platforms.equals5.metrics.ctr.toFixed(2)}%`
      : "N/A",

  // Executive Summary
  "{{HIGHLIGHTS}}": (_data, summary) =>
    summary?.highlights.join("\n• ") || "",
  "{{RECOMMENDATIONS}}": (_data, summary) =>
    summary?.recommendations?.join("\n• ") || "",
};

/**
 * Slide request types for Google Slides API
 */
export interface SlideRequest {
  replaceAllText?: {
    replaceText: string;
    containsText: {
      text: string;
      matchCase: boolean;
    };
  };
  replaceAllShapesWithImage?: {
    imageUrl: string;
    replaceMethod: "CENTER_INSIDE" | "CENTER_CROP";
    containsText: {
      text: string;
      matchCase: boolean;
    };
  };
  createImage?: {
    url: string;
    elementProperties: {
      pageObjectId: string;
      size?: {
        width: { magnitude: number; unit: string };
        height: { magnitude: number; unit: string };
      };
      transform?: {
        scaleX: number;
        scaleY: number;
        translateX: number;
        translateY: number;
        unit: string;
      };
    };
  };
}

/**
 * Build text replacement requests for all placeholders
 */
export function buildTextReplacements(
  data: ClientReportData,
  summary?: ExecutiveSummary
): SlideRequest[] {
  const requests: SlideRequest[] = [];

  for (const [placeholder, resolver] of Object.entries(PLACEHOLDER_RESOLVERS)) {
    const value = resolver(data, summary);
    requests.push({
      replaceAllText: {
        replaceText: value,
        containsText: {
          text: placeholder,
          matchCase: true,
        },
      },
    });
  }

  // Add platform breakdown table data
  for (const platformData of data.totals.byPlatform) {
    const platformKey = platformData.platform.toUpperCase();
    requests.push(
      {
        replaceAllText: {
          replaceText: `${platformData.percentOfTotal.toFixed(1)}%`,
          containsText: {
            text: `{{${platformKey}_PERCENT}}`,
            matchCase: true,
          },
        },
      }
    );
  }

  return requests;
}

/**
 * Build image replacement requests for screenshots
 */
export function buildScreenshotReplacements(
  screenshots: ScreenshotData[]
): SlideRequest[] {
  const requests: SlideRequest[] = [];

  for (let i = 0; i < screenshots.length; i++) {
    const screenshot = screenshots[i];
    // Screenshots are typically placed with placeholders like {{SCREENSHOT_1}}, {{SCREENSHOT_2}}
    requests.push({
      replaceAllShapesWithImage: {
        imageUrl: screenshot.url,
        replaceMethod: "CENTER_INSIDE",
        containsText: {
          text: `{{SCREENSHOT_${i + 1}}}`,
          matchCase: true,
        },
      },
    });

    // Also support named screenshots
    if (screenshot.name) {
      const normalizedName = screenshot.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_");
      requests.push({
        replaceAllShapesWithImage: {
          imageUrl: screenshot.url,
          replaceMethod: "CENTER_INSIDE",
          containsText: {
            text: `{{SCREENSHOT_${normalizedName}}}`,
            matchCase: true,
          },
        },
      });
    }
  }

  return requests;
}

/**
 * Build all slide modification requests
 */
export function buildSlideRequests(
  data: ClientReportData,
  summary?: ExecutiveSummary,
  screenshots?: ScreenshotData[]
): SlideRequest[] {
  const requests: SlideRequest[] = [];

  // Text replacements
  requests.push(...buildTextReplacements(data, summary));

  // Screenshot replacements
  if (screenshots && screenshots.length > 0) {
    requests.push(...buildScreenshotReplacements(screenshots));
  }

  return requests;
}

/**
 * Resolve a custom placeholder path to a value
 * Supports dot notation: "totals.totalSpend", "platforms.meta.metrics.impressions"
 */
export function resolvePlaceholderPath(
  data: ClientReportData,
  path: string
): unknown {
  const parts = path.split(".");
  let current: unknown = data;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Format a value based on placeholder type
 */
export function formatPlaceholderValue(
  value: unknown,
  type: TemplatePlaceholder["type"],
  format?: string
): string {
  if (value === null || value === undefined) {
    return "N/A";
  }

  switch (type) {
    case "text":
      return String(value);

    case "number":
      if (typeof value === "number") {
        return value.toLocaleString();
      }
      return String(value);

    case "currency":
      if (typeof value === "number") {
        return `$${value.toLocaleString()}`;
      }
      return String(value);

    case "percent":
      if (typeof value === "number") {
        return `${value.toFixed(2)}%`;
      }
      return String(value);

    case "chart":
      // Charts are handled separately
      return "[CHART]";

    case "image":
      // Images are handled separately
      return "[IMAGE]";

    default:
      return String(value);
  }
}

/**
 * Build requests from a custom template configuration
 */
export function buildRequestsFromTemplate(
  data: ClientReportData,
  template: ReportTemplate,
  summary?: ExecutiveSummary
): SlideRequest[] {
  const requests: SlideRequest[] = [];

  // Process standard placeholders first
  requests.push(...buildTextReplacements(data, summary));

  // Process template-specific placeholders
  for (const section of template.sections) {
    for (const placeholder of section.placeholders) {
      if (placeholder.type === "chart" || placeholder.type === "image") {
        // Skip charts and images - handled separately
        continue;
      }

      const rawValue = resolvePlaceholderPath(data, placeholder.source);
      const formattedValue = formatPlaceholderValue(
        rawValue,
        placeholder.type,
        placeholder.format
      );

      requests.push({
        replaceAllText: {
          replaceText: formattedValue,
          containsText: {
            text: placeholder.key,
            matchCase: true,
          },
        },
      });
    }
  }

  return requests;
}

/**
 * Generate a summary of what will be replaced
 * Useful for previewing changes before applying
 */
export function generateReplacementPreview(
  data: ClientReportData,
  summary?: ExecutiveSummary
): Record<string, string> {
  const preview: Record<string, string> = {};

  for (const [placeholder, resolver] of Object.entries(PLACEHOLDER_RESOLVERS)) {
    preview[placeholder] = resolver(data, summary);
  }

  // Platform percentages
  for (const platformData of data.totals.byPlatform) {
    const platformKey = platformData.platform.toUpperCase();
    preview[`{{${platformKey}_PERCENT}}`] = `${platformData.percentOfTotal.toFixed(1)}%`;
  }

  return preview;
}

/**
 * Validate that required data is present for report generation
 */
export function validateReportData(
  data: ClientReportData
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.clientId) {
    errors.push("Missing client ID");
  }

  if (!data.clientName) {
    errors.push("Missing client name");
  }

  if (!data.period) {
    errors.push("Missing report period");
  }

  if (!data.totals) {
    errors.push("Missing aggregated totals");
  }

  // Check that at least one platform has data
  const hasPlatformData = Object.values(data.platforms).some((p) => p !== undefined);
  if (!hasPlatformData) {
    errors.push("No platform data available");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate slide notes with data context
 * Useful for analysts reviewing the report
 */
export function generateSlideNotes(
  data: ClientReportData,
  slideType: "summary" | "spend" | "performance" | "platform" | "comparison"
): string {
  const notes: string[] = [];
  notes.push(`Report generated: ${data.generatedAt.toISOString()}`);
  notes.push(`Period: ${data.period.label}`);

  switch (slideType) {
    case "summary":
      notes.push("\n--- Key Metrics ---");
      notes.push(`Total Spend: $${data.totals.totalSpend.toLocaleString()}`);
      notes.push(`Total Impressions: ${data.totals.totalImpressions.toLocaleString()}`);
      notes.push(`Total Reach: ${data.totals.totalReach.toLocaleString()}`);
      notes.push(`Total Clicks: ${data.totals.totalClicks.toLocaleString()}`);
      notes.push(`Overall CTR: ${data.totals.overallCtr.toFixed(2)}%`);
      break;

    case "spend":
      notes.push("\n--- Spend Breakdown ---");
      for (const platform of data.totals.byPlatform) {
        notes.push(
          `${PLATFORM_NAMES[platform.platform]}: $${platform.spend.toLocaleString()} (${platform.percentOfTotal.toFixed(1)}%)`
        );
      }
      break;

    case "performance":
      notes.push("\n--- Performance Metrics ---");
      for (const platform of data.totals.byPlatform) {
        notes.push(`\n${PLATFORM_NAMES[platform.platform]}:`);
        notes.push(`  Impressions: ${platform.impressions.toLocaleString()}`);
        notes.push(`  Clicks: ${platform.clicks.toLocaleString()}`);
        notes.push(`  CTR: ${platform.ctr.toFixed(2)}%`);
      }
      break;

    case "platform":
      notes.push("\n--- Platform Details ---");
      for (const [platform, platformData] of Object.entries(data.platforms)) {
        if (!platformData) continue;
        notes.push(`\n${PLATFORM_NAMES[platform as Platform]}:`);
        notes.push(`  Data fetched: ${platformData.fetchedAt.toISOString()}`);
        if (platformData.campaigns) {
          notes.push(`  Campaigns: ${platformData.campaigns.length}`);
        }
      }
      break;

    case "comparison":
      if (data.comparison) {
        notes.push("\n--- Month-over-Month Changes ---");
        notes.push(`Comparing ${data.period.label} vs ${data.previousPeriod?.label}`);
        notes.push(
          `Spend: ${data.comparison.spendChange.percentChange >= 0 ? "+" : ""}${data.comparison.spendChange.percentChange.toFixed(1)}%`
        );
        notes.push(
          `Impressions: ${data.comparison.impressionsChange.percentChange >= 0 ? "+" : ""}${data.comparison.impressionsChange.percentChange.toFixed(1)}%`
        );
        notes.push(
          `CTR: ${data.comparison.ctrChange.percentChange >= 0 ? "+" : ""}${data.comparison.ctrChange.percentChange.toFixed(1)}%`
        );
      }
      break;
  }

  return notes.join("\n");
}
