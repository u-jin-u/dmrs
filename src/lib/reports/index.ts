/**
 * Report Generation Module
 *
 * Exports all report generation functionality
 */

// Types
export * from "./types";

// Data Aggregation
export {
  normalizeMetaData,
  normalizeGA4Data,
  normalizeEquals5Data,
  aggregateMetrics,
  calculatePercentChange,
  calculateComparison,
  buildClientReportData,
  getMonthPeriod,
  getPreviousMonthPeriod,
} from "./aggregator";

// Chart Data
export {
  buildSpendByPlatformChart,
  buildImpressionsByPlatformChart,
  buildMoMComparisonChart,
  buildCtrByPlatformChart,
  buildPlatformBreakdownChart,
  buildPerformanceIndicators,
  buildAllCharts,
  formatMetricsForDisplay,
} from "./charts";

// XLSX Generation
export {
  generateXlsxReport,
  saveXlsxToFile,
} from "./xlsx-generator";

// Google Slides Generation
export {
  buildTextReplacements,
  buildScreenshotReplacements,
  buildSlideRequests,
  buildRequestsFromTemplate,
  resolvePlaceholderPath,
  formatPlaceholderValue,
  generateReplacementPreview,
  validateReportData,
  generateSlideNotes,
} from "./slides-generator";

export type { SlideRequest } from "./slides-generator";

// Screenshot Handling
export {
  buildDriveQuery,
  sortScreenshots,
  filterScreenshotsByPattern,
  extractScreenshotCategory,
  groupScreenshotsByCategory,
  generatePlaceholderName,
  mapScreenshotsToPlaceholders,
  validateScreenshotDimensions,
  calculateResizeDimensions,
  prepareScreenshotsForReport,
  buildInsertionManifest,
  validateScreenshotUrl,
  generateDriveDownloadUrl,
  generateDriveEmbedUrl,
  driveFileToScreenshotData,
} from "./screenshots";

export type {
  ScreenshotFetchOptions,
  ScreenshotProcessingOptions,
} from "./screenshots";
