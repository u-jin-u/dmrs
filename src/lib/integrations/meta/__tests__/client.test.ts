/**
 * Meta Ads Client Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MetaAdsClient, MetaApiError } from "../client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("MetaAdsClient", () => {
  let client: MetaAdsClient;
  const testToken = "test_access_token_123";

  beforeEach(() => {
    vi.clearAllMocks();
    client = new MetaAdsClient(testToken);
  });

  describe("getAdAccounts", () => {
    it("should fetch ad accounts successfully", async () => {
      const mockAccounts = {
        data: [
          {
            id: "act_123456",
            account_id: "123456",
            name: "Test Account",
            currency: "USD",
            timezone_name: "America/New_York",
            account_status: 1,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAccounts),
      });

      const accounts = await client.getAdAccounts();

      expect(accounts).toHaveLength(1);
      expect(accounts[0].name).toBe("Test Account");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain("/me/adaccounts");
      expect(mockFetch.mock.calls[0][0]).toContain(`access_token=${testToken}`);
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: {
              message: "Invalid OAuth access token",
              type: "OAuthException",
              code: 190,
            },
          }),
      });

      await expect(client.getAdAccounts()).rejects.toThrow(MetaApiError);
    });
  });

  describe("getAccountInsights", () => {
    it("should fetch insights with date range", async () => {
      const mockInsights = {
        data: [
          {
            spend: "1000.50",
            impressions: "50000",
            reach: "25000",
            clicks: "500",
            ctr: "1.0",
            date_start: "2024-01-01",
            date_stop: "2024-01-31",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInsights),
      });

      const insights = await client.getAccountInsights({
        adAccountId: "123456",
        dateStart: new Date("2024-01-01"),
        dateEnd: new Date("2024-01-31"),
      });

      expect(insights.data).toHaveLength(1);
      expect(insights.data[0].spend).toBe("1000.50");
      expect(mockFetch.mock.calls[0][0]).toContain("/act_123456/insights");
    });

    it("should include custom fields when specified", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await client.getAccountInsights({
        adAccountId: "123456",
        dateStart: new Date("2024-01-01"),
        dateEnd: new Date("2024-01-31"),
        fields: ["spend", "impressions"],
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("fields=spend%2Cimpressions");
    });
  });

  describe("getCampaignInsights", () => {
    it("should fetch campaign-level insights", async () => {
      const mockCampaignInsights = {
        data: [
          {
            campaign_id: "camp_1",
            campaign_name: "Campaign 1",
            spend: "500.00",
            impressions: "25000",
            reach: "12500",
            clicks: "250",
            ctr: "1.0",
            date_start: "2024-01-01",
            date_stop: "2024-01-31",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCampaignInsights),
      });

      const insights = await client.getCampaignInsights({
        adAccountId: "123456",
        dateStart: new Date("2024-01-01"),
        dateEnd: new Date("2024-01-31"),
      });

      expect(insights.data[0].campaign_name).toBe("Campaign 1");
      expect(mockFetch.mock.calls[0][0]).toContain("level=campaign");
    });
  });

  describe("fetchData", () => {
    it("should fetch and process all data", async () => {
      // Mock account insights
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                spend: "1000.00",
                impressions: "50000",
                reach: "25000",
                clicks: "500",
                ctr: "1.0",
              },
            ],
          }),
      });

      // Mock campaign insights
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                campaign_id: "camp_1",
                campaign_name: "Campaign 1",
                spend: "600.00",
                impressions: "30000",
                reach: "15000",
                clicks: "300",
                ctr: "1.0",
              },
              {
                campaign_id: "camp_2",
                campaign_name: "Campaign 2",
                spend: "400.00",
                impressions: "20000",
                reach: "10000",
                clicks: "200",
                ctr: "1.0",
              },
            ],
          }),
      });

      const data = await client.fetchData(
        "123456",
        new Date("2024-01-01"),
        new Date("2024-01-31")
      );

      expect(data.accountId).toBe("123456");
      expect(data.spend).toBe(1000);
      expect(data.impressions).toBe(50000);
      expect(data.campaigns).toHaveLength(2);
      expect(data.campaigns[0].campaignName).toBe("Campaign 1");
    });

    it("should handle empty account data gracefully", async () => {
      // Mock empty account insights
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      // Mock empty campaign insights
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const data = await client.fetchData(
        "123456",
        new Date("2024-01-01"),
        new Date("2024-01-31")
      );

      expect(data.spend).toBe(0);
      expect(data.impressions).toBe(0);
      expect(data.campaigns).toHaveLength(0);
    });
  });
});

describe("MetaApiError", () => {
  it("should identify rate limit errors", () => {
    const error = new MetaApiError("Rate limit", 17);
    expect(error.isRateLimited()).toBe(true);

    const error2 = new MetaApiError("Rate limit", 4);
    expect(error2.isRateLimited()).toBe(true);

    const error3 = new MetaApiError("Not rate limit", 100);
    expect(error3.isRateLimited()).toBe(false);
  });

  it("should identify token expired errors", () => {
    const error = new MetaApiError("Token expired", 190);
    expect(error.isTokenExpired()).toBe(true);

    const error2 = new MetaApiError("Other error", 100);
    expect(error2.isTokenExpired()).toBe(false);
  });

  it("should identify permission errors", () => {
    const error = new MetaApiError("Permission denied", 10);
    expect(error.isPermissionError()).toBe(true);

    const error2 = new MetaApiError("Permission denied", 200);
    expect(error2.isPermissionError()).toBe(true);

    const error3 = new MetaApiError("Other error", 100);
    expect(error3.isPermissionError()).toBe(false);
  });
});
