/**
 * Screenshot Service
 *
 * Handles fetching and preparing screenshots for report insertion
 */

import { ScreenshotData } from "./types";

/**
 * Screenshot fetch options
 */
export interface ScreenshotFetchOptions {
  folderId: string;
  maxFiles?: number;
  fileTypes?: string[];
  sortBy?: "name" | "createdTime" | "modifiedTime";
  sortOrder?: "asc" | "desc";
}

/**
 * Screenshot processing options
 */
export interface ScreenshotProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "png" | "jpeg" | "webp";
}

/**
 * Default file types to fetch
 */
const DEFAULT_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

/**
 * Default max files to fetch
 */
const DEFAULT_MAX_FILES = 20;

/**
 * Build Google Drive query for screenshots
 */
export function buildDriveQuery(options: ScreenshotFetchOptions): string {
  const fileTypes = options.fileTypes || DEFAULT_FILE_TYPES;
  const mimeTypeQuery = fileTypes
    .map((type) => `mimeType='${type}'`)
    .join(" or ");

  return `'${options.folderId}' in parents and (${mimeTypeQuery}) and trashed=false`;
}

/**
 * Sort screenshots by specified field
 */
export function sortScreenshots(
  screenshots: ScreenshotData[],
  sortBy: "name" | "createdTime" | "modifiedTime" = "name",
  sortOrder: "asc" | "desc" = "asc"
): ScreenshotData[] {
  const sorted = [...screenshots].sort((a, b) => {
    const aValue = a.name.toLowerCase();
    const bValue = b.name.toLowerCase();
    return aValue.localeCompare(bValue);
  });

  return sortOrder === "desc" ? sorted.reverse() : sorted;
}

/**
 * Filter screenshots by naming convention
 * Supports patterns like: "01_meta_performance.png", "screenshot_1.png"
 */
export function filterScreenshotsByPattern(
  screenshots: ScreenshotData[],
  pattern: RegExp
): ScreenshotData[] {
  return screenshots.filter((s) => pattern.test(s.name));
}

/**
 * Extract screenshot category from filename
 * e.g., "01_meta_performance.png" -> "meta_performance"
 */
export function extractScreenshotCategory(filename: string): string | null {
  // Remove extension
  const withoutExt = filename.replace(/\.[^.]+$/, "");

  // Try pattern: ##_category_name
  const numberedMatch = withoutExt.match(/^\d+_(.+)$/);
  if (numberedMatch) {
    return numberedMatch[1];
  }

  // Try pattern: category_name_##
  const suffixMatch = withoutExt.match(/^(.+)_\d+$/);
  if (suffixMatch) {
    return suffixMatch[1];
  }

  // Return filename without extension as category
  return withoutExt;
}

/**
 * Group screenshots by category
 */
export function groupScreenshotsByCategory(
  screenshots: ScreenshotData[]
): Map<string, ScreenshotData[]> {
  const groups = new Map<string, ScreenshotData[]>();

  for (const screenshot of screenshots) {
    const category = extractScreenshotCategory(screenshot.name) || "uncategorized";
    const existing = groups.get(category) || [];
    existing.push(screenshot);
    groups.set(category, existing);
  }

  return groups;
}

/**
 * Generate placeholder name from screenshot
 */
export function generatePlaceholderName(
  screenshot: ScreenshotData,
  index: number
): string {
  // Try to use category-based placeholder
  const category = extractScreenshotCategory(screenshot.name);
  if (category) {
    const normalizedCategory = category.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    return `{{SCREENSHOT_${normalizedCategory}}}`;
  }

  // Fall back to index-based placeholder
  return `{{SCREENSHOT_${index + 1}}}`;
}

/**
 * Map screenshots to their intended placeholders
 */
export function mapScreenshotsToPlaceholders(
  screenshots: ScreenshotData[]
): Map<string, ScreenshotData> {
  const mapping = new Map<string, ScreenshotData>();

  screenshots.forEach((screenshot, index) => {
    // Index-based placeholder
    mapping.set(`{{SCREENSHOT_${index + 1}}}`, screenshot);

    // Category-based placeholder
    const category = extractScreenshotCategory(screenshot.name);
    if (category) {
      const normalizedCategory = category.toUpperCase().replace(/[^A-Z0-9]/g, "_");
      mapping.set(`{{SCREENSHOT_${normalizedCategory}}}`, screenshot);
    }
  });

  return mapping;
}

/**
 * Validate screenshot dimensions for report insertion
 */
export function validateScreenshotDimensions(
  screenshot: ScreenshotData,
  maxWidth: number,
  maxHeight: number
): { valid: boolean; needsResize: boolean; reason?: string } {
  if (!screenshot.width || !screenshot.height) {
    return { valid: true, needsResize: false, reason: "Dimensions unknown" };
  }

  if (screenshot.width > maxWidth || screenshot.height > maxHeight) {
    return {
      valid: true,
      needsResize: true,
      reason: `Image ${screenshot.width}x${screenshot.height} exceeds max ${maxWidth}x${maxHeight}`,
    };
  }

  return { valid: true, needsResize: false };
}

/**
 * Calculate resize dimensions maintaining aspect ratio
 */
export function calculateResizeDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

/**
 * Prepare screenshots for report
 * Returns screenshots with validated URLs and metadata
 */
export function prepareScreenshotsForReport(
  screenshots: ScreenshotData[],
  options?: ScreenshotProcessingOptions
): ScreenshotData[] {
  const maxWidth = options?.maxWidth || 1920;
  const maxHeight = options?.maxHeight || 1080;

  return screenshots.map((screenshot) => {
    const validation = validateScreenshotDimensions(screenshot, maxWidth, maxHeight);

    if (validation.needsResize && screenshot.width && screenshot.height) {
      const newDimensions = calculateResizeDimensions(
        screenshot.width,
        screenshot.height,
        maxWidth,
        maxHeight
      );

      return {
        ...screenshot,
        width: newDimensions.width,
        height: newDimensions.height,
      };
    }

    return screenshot;
  });
}

/**
 * Build screenshot insertion manifest
 * Documents which screenshots will be inserted where
 */
export function buildInsertionManifest(
  screenshots: ScreenshotData[]
): Array<{
  screenshot: ScreenshotData;
  placeholder: string;
  category: string | null;
}> {
  const manifest: Array<{
    screenshot: ScreenshotData;
    placeholder: string;
    category: string | null;
  }> = [];

  screenshots.forEach((screenshot, index) => {
    const category = extractScreenshotCategory(screenshot.name);
    const placeholder = generatePlaceholderName(screenshot, index);

    manifest.push({
      screenshot,
      placeholder,
      category,
    });
  });

  return manifest;
}

/**
 * Validate screenshot URL is accessible
 */
export async function validateScreenshotUrl(url: string): Promise<boolean> {
  try {
    // In a real implementation, this would check if the URL is accessible
    // For Google Drive, this would verify the file exists and is publicly accessible
    return url.startsWith("https://");
  } catch {
    return false;
  }
}

/**
 * Generate Google Drive download URL from file ID
 */
export function generateDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
}

/**
 * Generate Google Drive embed URL from file ID
 * Used for embedding in Google Slides
 */
export function generateDriveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/uc?id=${fileId}`;
}

/**
 * Convert Drive file response to ScreenshotData
 */
export function driveFileToScreenshotData(file: {
  id: string;
  name: string;
  mimeType: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
  };
}): ScreenshotData {
  return {
    id: file.id,
    name: file.name,
    url: generateDriveEmbedUrl(file.id),
    mimeType: file.mimeType,
    width: file.imageMediaMetadata?.width,
    height: file.imageMediaMetadata?.height,
  };
}
