/**
 * Equals 5 Data Parser
 *
 * Parses exported XLSX files from Equals 5
 */

import * as XLSX from "xlsx";
import { Equals5Data } from "./types";
import { ExtractionError } from "./errors";

/**
 * Column mapping for Equals 5 export
 * Keys are possible column header variations (lowercase), values are our normalized metric names
 */
const COLUMN_MAPPING: Record<string, keyof Equals5Data | "ignore"> = {
  // Impressions
  impressions: "impressions",
  "total impressions": "impressions",
  imps: "impressions",

  // Identified Impressions
  "identified impressions": "identifiedImpressions",
  "id impressions": "identifiedImpressions",

  // Clicks
  clicks: "clicks",
  "total clicks": "clicks",

  // Identified Clicks
  "identified clicks": "identifiedClicks",
  "id clicks": "identifiedClicks",

  // CTR - handle percentage format
  ctr: "avgCtr",
  "avg ctr": "avgCtr",
  "avg ctr %": "avgCtr",
  "click through rate": "avgCtr",
  "average ctr": "avgCtr",

  // Reach
  reach: "reach",
  "unique reach": "reach",

  // Visits Media (actual column name in export)
  "visits media": "visitsMedia",
  "visit media signals": "visitsMedia",
  visits: "visitsMedia",

  // Clicks Media (actual column name in export)
  "clicks media": "clicksMedia",
  "click media signals": "clicksMedia",

  // Signals
  signals: "signals",
  "total signals": "signals",

  // Spend (actual column name in export)
  spend: "spend",
  cost: "spend",
  "total spend": "spend",
  "total costs $": "spend",
  budget: "spend",

  // Ignore these columns
  campaign: "ignore",
  "campaign name": "ignore",
  status: "ignore",
  "start date": "ignore",
  "end date": "ignore",
  id: "ignore",
  "campaign id": "ignore",
  targets: "ignore",
  "link clicks": "ignore",
};

/**
 * Parse XLSX file and extract metrics
 */
export function parseExportFile(
  filePath: string,
  dateStart: Date,
  dateEnd: Date
): Equals5Data {
  try {
    // Read workbook
    const workbook = XLSX.readFile(filePath);

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new ExtractionError("Excel file has no sheets");
    }

    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON - header: 1 returns array of arrays
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: null,
    });

    if (rawRows.length < 2) {
      throw new ExtractionError("Excel file has no data rows");
    }

    // First row is headers
    const headers = rawRows[0].map((h) =>
      String(h || "").toLowerCase().trim()
    );
    const dataRows = rawRows.slice(1);

    // Look for "Total" row (last row usually contains totals)
    let totalsRow: unknown[] | null = null;
    for (let i = dataRows.length - 1; i >= 0; i--) {
      const row = dataRows[i];
      const firstCell = String(row[0] || "").toLowerCase();
      if (firstCell === "total" || firstCell.startsWith("total")) {
        totalsRow = row;
        break;
      }
    }

    // If we found a totals row, use it directly; otherwise aggregate
    const metrics = totalsRow
      ? extractMetricsFromRow(headers, totalsRow)
      : aggregateMetrics(headers, dataRows);

    // Also get raw data as object rows
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    return {
      impressions: metrics.impressions,
      identifiedImpressions: metrics.identifiedImpressions,
      clicks: metrics.clicks,
      identifiedClicks: metrics.identifiedClicks,
      avgCtr: metrics.avgCtr,
      reach: metrics.reach,
      visitsMedia: metrics.visitsMedia,
      clicksMedia: metrics.clicksMedia,
      signals: metrics.signals,
      spend: metrics.spend,
      rawData: { rows: rawData },
      dateStart,
      dateEnd,
      extractedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof ExtractionError) {
      throw error;
    }

    throw new ExtractionError(
      `Failed to parse export file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extract metrics from a single row (e.g., the Total row)
 */
function extractMetricsFromRow(
  headers: string[],
  row: unknown[]
): Partial<Equals5Data> {
  const result: Partial<Equals5Data> = {
    impressions: 0,
    identifiedImpressions: 0,
    clicks: 0,
    identifiedClicks: 0,
    avgCtr: 0,
    reach: 0,
    visitsMedia: 0,
    clicksMedia: 0,
    signals: 0,
    spend: 0,
  };

  headers.forEach((header, index) => {
    const mapping = COLUMN_MAPPING[header];
    if (mapping && mapping !== "ignore") {
      const value = row[index];
      const numValue = parseNumericValue(value);
      if (numValue !== null) {
        (result as Record<string, number>)[mapping] = numValue;
      }
    }
  });

  return result;
}

/**
 * Aggregate metrics from data rows
 */
function aggregateMetrics(
  headers: string[],
  dataRows: unknown[][]
): Partial<Equals5Data> {
  const result: Partial<Equals5Data> = {
    impressions: 0,
    identifiedImpressions: 0,
    clicks: 0,
    identifiedClicks: 0,
    avgCtr: 0,
    reach: 0,
    visitsMedia: 0,
    clicksMedia: 0,
    signals: 0,
    spend: 0,
  };

  // Build column index map
  const columnMap: Map<number, keyof Equals5Data> = new Map();

  headers.forEach((header, index) => {
    const mapping = COLUMN_MAPPING[header];
    if (mapping && mapping !== "ignore") {
      columnMap.set(index, mapping);
    }
  });

  // Aggregate values from rows
  let rowCount = 0;

  for (const row of dataRows) {
    if (!row || row.length === 0) continue;

    rowCount++;

    columnMap.forEach((metricKey, columnIndex) => {
      const value = row[columnIndex];
      const numValue = parseNumericValue(value);

      if (numValue !== null) {
        // For averages (CTR), we'll calculate weighted average later
        if (metricKey === "avgCtr") {
          (result as Record<string, number>)[metricKey] =
            ((result[metricKey] as number) || 0) + numValue;
        } else {
          (result as Record<string, number>)[metricKey] =
            ((result[metricKey] as number) || 0) + numValue;
        }
      }
    });
  }

  // Calculate average CTR
  if (rowCount > 0 && result.avgCtr) {
    result.avgCtr = result.avgCtr / rowCount;
  }

  return result;
}

/**
 * Parse a value to number, handling various formats
 */
function parseNumericValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return isNaN(value) ? null : value;
  }

  if (typeof value === "string") {
    // Remove currency symbols, commas, percentage signs
    const cleaned = value
      .replace(/[$€£¥,]/g, "")
      .replace(/%/g, "")
      .trim();

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Parse a buffer (for in-memory parsing)
 */
export function parseExportBuffer(
  buffer: Buffer,
  dateStart: Date,
  dateEnd: Date
): Equals5Data {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new ExtractionError("Excel file has no sheets");
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: null,
    });

    if (rawRows.length < 2) {
      throw new ExtractionError("Excel file has no data rows");
    }

    const headers = rawRows[0].map((h) =>
      String(h || "").toLowerCase().trim()
    );
    const dataRows = rawRows.slice(1);
    const aggregated = aggregateMetrics(headers, dataRows);
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    return {
      impressions: aggregated.impressions,
      identifiedImpressions: aggregated.identifiedImpressions,
      clicks: aggregated.clicks,
      identifiedClicks: aggregated.identifiedClicks,
      avgCtr: aggregated.avgCtr,
      reach: aggregated.reach,
      visitsMedia: aggregated.visitsMedia,
      clicksMedia: aggregated.clicksMedia,
      signals: aggregated.signals,
      spend: aggregated.spend,
      rawData: { rows: rawData },
      dateStart,
      dateEnd,
      extractedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof ExtractionError) {
      throw error;
    }

    throw new ExtractionError(
      `Failed to parse export buffer: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validate parsed data has required fields
 */
export function validateParsedData(data: Equals5Data): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for zero values that might indicate parsing issues
  if (data.impressions === 0) {
    warnings.push("Impressions is 0 - this might indicate a parsing issue");
  }

  if (data.clicks === 0) {
    warnings.push("Clicks is 0 - verify if this is expected");
  }

  // Check raw data exists
  if (!data.rawData || Object.keys(data.rawData).length === 0) {
    warnings.push("No raw data captured");
  }

  return {
    valid: warnings.length === 0 || data.impressions !== undefined,
    warnings,
  };
}
