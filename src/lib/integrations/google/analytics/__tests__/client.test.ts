/**
 * GA4 Client Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GA4Client, GA4ApiError } from "../client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("GA4Client", () => {
  let client: GA4Client;
  const testToken = "test_access_token_123";

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GA4Client(testToken);
  });

  describe("getProperties", () => {
    it("should fetch GA4 properties successfully", async () => {
      const mockResponse = {
        accountSummaries: [
          {
            account: "accounts/123",
            displayName: "Test Account",
            propertySummaries: [
              {
                property: "properties/456789",
                displayName: "Test Property",
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const properties = await client.getProperties();

      expect(properties).toHaveLength(1);
      expect(properties[0].propertyId).toBe("456789");
      expect(properties[0].displayName).toBe("Test Property");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain("accountSummaries");
    });

    it("should handle empty account summaries", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ accountSummaries: [] }),
      });

      const properties = await client.getProperties();

      expect(properties).toHaveLength(0);
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: {
              code: 401,
              message: "Invalid credentials",
              status: "UNAUTHENTICATED",
            },
          }),
      });

      await expect(client.getProperties()).rejects.toThrow(GA4ApiError);
    });
  });

  describe("runReport", () => {
    it("should run report with correct parameters", async () => {
      const mockResponse = {
        dimensionHeaders: [{ name: "date" }],
        metricHeaders: [{ name: "sessions", type: "INTEGER" }],
        rows: [
          {
            dimensionValues: [{ value: "20240101" }],
            metricValues: [{ value: "1000" }],
          },
        ],
        rowCount: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await client.runReport({
        propertyId: "123456",
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        metrics: [{ name: "sessions" }],
      });

      expect(response.rows).toHaveLength(1);
      expect(response.rows![0].metricValues![0].value).toBe("1000");
      expect(mockFetch.mock.calls[0][0]).toContain("/properties/123456:runReport");
    });
  });

  describe("fetchData", () => {
    it("should fetch and process all data", async () => {
      // Mock overview metrics
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            metricHeaders: [
              { name: "sessions" },
              { name: "totalUsers" },
              { name: "newUsers" },
              { name: "screenPageViews" },
              { name: "bounceRate" },
              { name: "averageSessionDuration" },
              { name: "eventsPerSession" },
              { name: "engagementRate" },
            ],
            rows: [
              {
                metricValues: [
                  { value: "1000" },
                  { value: "800" },
                  { value: "500" },
                  { value: "3000" },
                  { value: "0.35" },
                  { value: "120" },
                  { value: "2.5" },
                  { value: "0.65" },
                ],
              },
            ],
          }),
      });

      // Mock top pages
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            dimensionHeaders: [{ name: "pagePath" }, { name: "pageTitle" }],
            metricHeaders: [
              { name: "screenPageViews" },
              { name: "sessions" },
              { name: "averageSessionDuration" },
              { name: "bounceRate" },
            ],
            rows: [
              {
                dimensionValues: [{ value: "/" }, { value: "Home" }],
                metricValues: [
                  { value: "1500" },
                  { value: "500" },
                  { value: "90" },
                  { value: "0.30" },
                ],
              },
            ],
          }),
      });

      // Mock traffic sources
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            dimensionHeaders: [{ name: "sessionSource" }, { name: "sessionMedium" }],
            metricHeaders: [
              { name: "sessions" },
              { name: "totalUsers" },
              { name: "newUsers" },
              { name: "bounceRate" },
            ],
            rows: [
              {
                dimensionValues: [{ value: "google" }, { value: "organic" }],
                metricValues: [
                  { value: "400" },
                  { value: "350" },
                  { value: "200" },
                  { value: "0.25" },
                ],
              },
            ],
          }),
      });

      const data = await client.fetchData(
        "123456",
        new Date("2024-01-01"),
        new Date("2024-01-31")
      );

      expect(data.propertyId).toBe("123456");
      expect(data.sessions).toBe(1000);
      expect(data.users).toBe(800);
      expect(data.pageviews).toBe(3000);
      expect(data.topPages).toHaveLength(1);
      expect(data.topPages[0].pagePath).toBe("/");
      expect(data.topSources).toHaveLength(1);
      expect(data.topSources[0].source).toBe("google");
    });

    it("should handle empty data gracefully", async () => {
      // Mock empty responses
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            metricHeaders: [],
            rows: [],
          }),
      });

      const data = await client.fetchData(
        "123456",
        new Date("2024-01-01"),
        new Date("2024-01-31")
      );

      expect(data.sessions).toBe(0);
      expect(data.users).toBe(0);
      expect(data.topPages).toHaveLength(0);
      expect(data.topSources).toHaveLength(0);
    });
  });
});

describe("GA4ApiError", () => {
  it("should identify rate limit errors", () => {
    const error = new GA4ApiError("Rate limit", 429);
    expect(error.isRateLimited()).toBe(true);

    const error2 = new GA4ApiError("Rate limit", 500, "RESOURCE_EXHAUSTED");
    expect(error2.isRateLimited()).toBe(true);

    const error3 = new GA4ApiError("Other error", 400);
    expect(error3.isRateLimited()).toBe(false);
  });

  it("should identify token expired errors", () => {
    const error = new GA4ApiError("Unauthorized", 401);
    expect(error.isTokenExpired()).toBe(true);

    const error2 = new GA4ApiError("Unauthorized", 400, "UNAUTHENTICATED");
    expect(error2.isTokenExpired()).toBe(true);

    const error3 = new GA4ApiError("Other error", 400);
    expect(error3.isTokenExpired()).toBe(false);
  });

  it("should identify permission errors", () => {
    const error = new GA4ApiError("Forbidden", 403);
    expect(error.isPermissionError()).toBe(true);

    const error2 = new GA4ApiError("Forbidden", 400, "PERMISSION_DENIED");
    expect(error2.isPermissionError()).toBe(true);

    const error3 = new GA4ApiError("Other error", 400);
    expect(error3.isPermissionError()).toBe(false);
  });

  it("should identify not found errors", () => {
    const error = new GA4ApiError("Not found", 404);
    expect(error.isNotFound()).toBe(true);

    const error2 = new GA4ApiError("Not found", 400, "NOT_FOUND");
    expect(error2.isNotFound()).toBe(true);

    const error3 = new GA4ApiError("Other error", 400);
    expect(error3.isNotFound()).toBe(false);
  });
});
