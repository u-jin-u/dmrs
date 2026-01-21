/**
 * Screenshot Service Tests
 */

import { describe, it, expect } from "vitest";
import {
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
  generateDriveDownloadUrl,
  generateDriveEmbedUrl,
  driveFileToScreenshotData,
} from "../screenshots";
import { ScreenshotData } from "../types";

describe("Screenshot Service", () => {
  const mockScreenshots: ScreenshotData[] = [
    {
      id: "file_1",
      name: "01_meta_performance.png",
      url: "https://drive.google.com/uc?id=file_1",
      mimeType: "image/png",
      width: 1920,
      height: 1080,
    },
    {
      id: "file_2",
      name: "02_ga4_traffic.png",
      url: "https://drive.google.com/uc?id=file_2",
      mimeType: "image/png",
      width: 1200,
      height: 800,
    },
    {
      id: "file_3",
      name: "03_equals5_spend.png",
      url: "https://drive.google.com/uc?id=file_3",
      mimeType: "image/png",
      width: 2400,
      height: 1600,
    },
  ];

  describe("buildDriveQuery", () => {
    it("should build query with folder ID and MIME types", () => {
      const query = buildDriveQuery({ folderId: "folder_123" });

      expect(query).toContain("'folder_123' in parents");
      expect(query).toContain("mimeType='image/png'");
      expect(query).toContain("mimeType='image/jpeg'");
      expect(query).toContain("trashed=false");
    });

    it("should use custom file types", () => {
      const query = buildDriveQuery({
        folderId: "folder_123",
        fileTypes: ["image/png"],
      });

      expect(query).toContain("mimeType='image/png'");
      expect(query).not.toContain("mimeType='image/jpeg'");
    });
  });

  describe("sortScreenshots", () => {
    it("should sort by name ascending", () => {
      const unsorted = [mockScreenshots[2], mockScreenshots[0], mockScreenshots[1]];
      const sorted = sortScreenshots(unsorted, "name", "asc");

      expect(sorted[0].name).toBe("01_meta_performance.png");
      expect(sorted[1].name).toBe("02_ga4_traffic.png");
      expect(sorted[2].name).toBe("03_equals5_spend.png");
    });

    it("should sort by name descending", () => {
      const sorted = sortScreenshots(mockScreenshots, "name", "desc");

      expect(sorted[0].name).toBe("03_equals5_spend.png");
      expect(sorted[2].name).toBe("01_meta_performance.png");
    });
  });

  describe("filterScreenshotsByPattern", () => {
    it("should filter by regex pattern", () => {
      const filtered = filterScreenshotsByPattern(mockScreenshots, /meta/);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("01_meta_performance.png");
    });

    it("should filter by numbered pattern", () => {
      const filtered = filterScreenshotsByPattern(mockScreenshots, /^\d{2}_/);

      expect(filtered).toHaveLength(3);
    });
  });

  describe("extractScreenshotCategory", () => {
    it("should extract category from numbered filename", () => {
      const category = extractScreenshotCategory("01_meta_performance.png");

      expect(category).toBe("meta_performance");
    });

    it("should extract category from suffix numbered filename", () => {
      const category = extractScreenshotCategory("meta_performance_01.png");

      expect(category).toBe("meta_performance");
    });

    it("should return filename without extension for non-standard format", () => {
      const category = extractScreenshotCategory("screenshot.png");

      expect(category).toBe("screenshot");
    });
  });

  describe("groupScreenshotsByCategory", () => {
    it("should group screenshots by category", () => {
      const groups = groupScreenshotsByCategory(mockScreenshots);

      expect(groups.size).toBe(3);
      expect(groups.get("meta_performance")).toHaveLength(1);
      expect(groups.get("ga4_traffic")).toHaveLength(1);
      expect(groups.get("equals5_spend")).toHaveLength(1);
    });
  });

  describe("generatePlaceholderName", () => {
    it("should generate category-based placeholder", () => {
      const placeholder = generatePlaceholderName(mockScreenshots[0], 0);

      expect(placeholder).toBe("{{SCREENSHOT_META_PERFORMANCE}}");
    });

    it("should fall back to index-based placeholder", () => {
      const screenshot: ScreenshotData = {
        id: "file_x",
        name: "image.png",
        url: "https://example.com",
        mimeType: "image/png",
      };
      const placeholder = generatePlaceholderName(screenshot, 5);

      expect(placeholder).toBe("{{SCREENSHOT_IMAGE}}");
    });
  });

  describe("mapScreenshotsToPlaceholders", () => {
    it("should create mapping with both index and category placeholders", () => {
      const mapping = mapScreenshotsToPlaceholders(mockScreenshots);

      expect(mapping.get("{{SCREENSHOT_1}}")).toBe(mockScreenshots[0]);
      expect(mapping.get("{{SCREENSHOT_META_PERFORMANCE}}")).toBe(mockScreenshots[0]);
      expect(mapping.get("{{SCREENSHOT_2}}")).toBe(mockScreenshots[1]);
    });
  });

  describe("validateScreenshotDimensions", () => {
    it("should pass validation for images within limits", () => {
      const result = validateScreenshotDimensions(mockScreenshots[0], 1920, 1080);

      expect(result.valid).toBe(true);
      expect(result.needsResize).toBe(false);
    });

    it("should indicate resize needed for oversized images", () => {
      const result = validateScreenshotDimensions(mockScreenshots[2], 1920, 1080);

      expect(result.valid).toBe(true);
      expect(result.needsResize).toBe(true);
      expect(result.reason).toContain("exceeds max");
    });

    it("should handle missing dimensions", () => {
      const screenshot: ScreenshotData = {
        id: "file_x",
        name: "image.png",
        url: "https://example.com",
        mimeType: "image/png",
      };
      const result = validateScreenshotDimensions(screenshot, 1920, 1080);

      expect(result.valid).toBe(true);
      expect(result.reason).toBe("Dimensions unknown");
    });
  });

  describe("calculateResizeDimensions", () => {
    it("should maintain aspect ratio when resizing", () => {
      const result = calculateResizeDimensions(2400, 1600, 1920, 1080);

      // 2400x1600 -> scale by min(1920/2400, 1080/1600) = min(0.8, 0.675) = 0.675
      expect(result.width).toBe(1620);
      expect(result.height).toBe(1080);
    });

    it("should handle portrait images", () => {
      const result = calculateResizeDimensions(1000, 2000, 1920, 1080);

      // Scale by 1080/2000 = 0.54
      expect(result.width).toBe(540);
      expect(result.height).toBe(1080);
    });
  });

  describe("prepareScreenshotsForReport", () => {
    it("should update dimensions for oversized images", () => {
      const prepared = prepareScreenshotsForReport(mockScreenshots, {
        maxWidth: 1920,
        maxHeight: 1080,
      });

      // Third image should be resized
      expect(prepared[2].width).toBe(1620);
      expect(prepared[2].height).toBe(1080);

      // First two should remain unchanged
      expect(prepared[0].width).toBe(1920);
      expect(prepared[1].width).toBe(1200);
    });
  });

  describe("buildInsertionManifest", () => {
    it("should create manifest with all screenshot details", () => {
      const manifest = buildInsertionManifest(mockScreenshots);

      expect(manifest).toHaveLength(3);
      expect(manifest[0].placeholder).toBe("{{SCREENSHOT_META_PERFORMANCE}}");
      expect(manifest[0].category).toBe("meta_performance");
      expect(manifest[0].screenshot).toBe(mockScreenshots[0]);
    });
  });

  describe("generateDriveDownloadUrl", () => {
    it("should generate correct download URL", () => {
      const url = generateDriveDownloadUrl("file_123");

      expect(url).toBe("https://drive.google.com/uc?id=file_123&export=download");
    });
  });

  describe("generateDriveEmbedUrl", () => {
    it("should generate correct embed URL", () => {
      const url = generateDriveEmbedUrl("file_123");

      expect(url).toBe("https://drive.google.com/uc?id=file_123");
    });
  });

  describe("driveFileToScreenshotData", () => {
    it("should convert Drive file to ScreenshotData", () => {
      const driveFile = {
        id: "file_123",
        name: "screenshot.png",
        mimeType: "image/png",
        imageMediaMetadata: {
          width: 1920,
          height: 1080,
        },
      };

      const result = driveFileToScreenshotData(driveFile);

      expect(result.id).toBe("file_123");
      expect(result.name).toBe("screenshot.png");
      expect(result.url).toBe("https://drive.google.com/uc?id=file_123");
      expect(result.mimeType).toBe("image/png");
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it("should handle missing dimensions", () => {
      const driveFile = {
        id: "file_123",
        name: "screenshot.png",
        mimeType: "image/png",
      };

      const result = driveFileToScreenshotData(driveFile);

      expect(result.width).toBeUndefined();
      expect(result.height).toBeUndefined();
    });
  });
});
