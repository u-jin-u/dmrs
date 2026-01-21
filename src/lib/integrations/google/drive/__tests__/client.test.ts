/**
 * Drive Client Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { DriveClient, DriveApiError } from "../client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("DriveClient", () => {
  let client: DriveClient;
  const testToken = "test_access_token_123";

  beforeEach(() => {
    vi.clearAllMocks();
    client = new DriveClient(testToken);
  });

  describe("getFile", () => {
    it("should fetch file metadata successfully", async () => {
      const mockFile = {
        id: "file123",
        name: "test.png",
        mimeType: "image/png",
        size: "1024",
        createdTime: "2024-01-01T00:00:00Z",
        modifiedTime: "2024-01-02T00:00:00Z",
        webViewLink: "https://drive.google.com/file/d/file123/view",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFile),
      });

      const file = await client.getFile("file123");

      expect(file.id).toBe("file123");
      expect(file.name).toBe("test.png");
      expect(file.mimeType).toBe("image/png");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain("/files/file123");
    });

    it("should handle not found errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            error: {
              code: 404,
              message: "File not found",
            },
          }),
      });

      await expect(client.getFile("nonexistent")).rejects.toThrow(DriveApiError);
    });
  });

  describe("listFiles", () => {
    it("should list files in a folder", async () => {
      const mockResponse = {
        files: [
          { id: "file1", name: "image1.png", mimeType: "image/png" },
          { id: "file2", name: "image2.jpg", mimeType: "image/jpeg" },
        ],
        nextPageToken: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await client.listFiles({
        folderId: "folder123",
        pageSize: 10,
      });

      expect(response.files).toHaveLength(2);
      expect(response.files[0].name).toBe("image1.png");
      expect(mockFetch.mock.calls[0][0]).toContain("folder123");
    });

    it("should filter by mime types", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: [] }),
      });

      await client.listFiles({
        folderId: "folder123",
        mimeTypes: ["image/png", "image/jpeg"],
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("mimeType");
    });
  });

  describe("getScreenshots", () => {
    it("should fetch screenshots from folder", async () => {
      const mockResponse = {
        files: [
          {
            id: "img1",
            name: "screenshot1.png",
            mimeType: "image/png",
            createdTime: "2024-01-15T10:00:00Z",
            thumbnailLink: "https://example.com/thumb1",
          },
          {
            id: "img2",
            name: "screenshot2.jpg",
            mimeType: "image/jpeg",
            createdTime: "2024-01-14T10:00:00Z",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const screenshots = await client.getScreenshots("folder123", 10);

      expect(screenshots).toHaveLength(2);
      expect(screenshots[0].id).toBe("img1");
      expect(screenshots[0].name).toBe("screenshot1.png");
      expect(screenshots[0].thumbnailUrl).toBe("https://example.com/thumb1");
      expect(screenshots[0].createdTime).toBeInstanceOf(Date);
    });
  });

  describe("uploadFile", () => {
    it("should upload file successfully", async () => {
      const mockResponse = {
        id: "newfile123",
        name: "report.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        webViewLink: "https://drive.google.com/file/d/newfile123/view",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const content = Buffer.from("test content");
      const file = await client.uploadFile(content, {
        name: "report.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        folderId: "folder123",
      });

      expect(file.id).toBe("newfile123");
      expect(file.name).toBe("report.xlsx");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain("uploadType=multipart");
    });

    it("should handle upload errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () =>
          Promise.resolve({
            error: {
              code: 403,
              message: "Insufficient permissions",
            },
          }),
      });

      const content = Buffer.from("test content");
      await expect(
        client.uploadFile(content, {
          name: "report.xlsx",
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
      ).rejects.toThrow();
    });
  });

  describe("createFolder", () => {
    it("should create folder successfully", async () => {
      const mockResponse = {
        id: "newfolder123",
        name: "Client Reports",
        webViewLink: "https://drive.google.com/drive/folders/newfolder123",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const folder = await client.createFolder("Client Reports", "parent123");

      expect(folder.id).toBe("newfolder123");
      expect(folder.name).toBe("Client Reports");
    });
  });

  describe("copyFile", () => {
    it("should copy file successfully", async () => {
      const mockResponse = {
        id: "copy123",
        name: "Report Copy",
        mimeType: "application/vnd.google-apps.presentation",
        webViewLink: "https://docs.google.com/presentation/d/copy123",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const file = await client.copyFile("template123", "Report Copy", "folder123");

      expect(file.id).toBe("copy123");
      expect(file.name).toBe("Report Copy");
      expect(mockFetch.mock.calls[0][0]).toContain("/files/template123/copy");
    });
  });
});

describe("DriveApiError", () => {
  it("should identify rate limit errors", () => {
    const error = new DriveApiError("Rate limit", 429);
    expect(error.isRateLimited()).toBe(true);

    const error2 = new DriveApiError("Rate limit", 403, "rateLimitExceeded");
    expect(error2.isRateLimited()).toBe(true);

    const error3 = new DriveApiError("Other error", 400);
    expect(error3.isRateLimited()).toBe(false);
  });

  it("should identify token expired errors", () => {
    const error = new DriveApiError("Unauthorized", 401);
    expect(error.isTokenExpired()).toBe(true);

    const error2 = new DriveApiError("Other error", 400);
    expect(error2.isTokenExpired()).toBe(false);
  });

  it("should identify permission errors", () => {
    const error = new DriveApiError("Forbidden", 403);
    expect(error.isPermissionError()).toBe(true);

    const error2 = new DriveApiError("Other error", 400);
    expect(error2.isPermissionError()).toBe(false);
  });

  it("should identify not found errors", () => {
    const error = new DriveApiError("Not found", 404);
    expect(error.isNotFound()).toBe(true);

    const error2 = new DriveApiError("Other error", 400);
    expect(error2.isNotFound()).toBe(false);
  });
});
