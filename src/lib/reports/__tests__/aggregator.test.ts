/**
 * Data Aggregation Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeMetaData,
  normalizeGA4Data,
  normalizeEquals5Data,
  aggregateMetrics,
  calculatePercentChange,
  calculateComparison,
  buildClientReportData,
  getMonthPeriod,
  getPreviousMonthPeriod,
} from "../aggregator";
import { MetaAdsData } from "../../integrations/meta/types";
import { GA4Data } from "../../integrations/google/analytics/types";
import { Equals5Data } from "../../integrations/equals5/types";
import { ReportPeriod, PlatformData } from "../types";

describe("Data Aggregation", () => {
  const testPeriod: ReportPeriod = {
    startDate: new Date("2025-12-01"),
    endDate: new Date("2025-12-31"),
    label: "December 2025",
  };

  describe("normalizeMetaData", () => {
    const mockMetaData: MetaAdsData = {
      accountId: "act_123",
      spend: 5000,
      impressions: 100000,
      reach: 50000,
      clicks: 2500,
      ctr: 2.5,
      campaigns: [
        {
          campaignId: "camp_1",
          campaignName: "Campaign 1",
          spend: 3000,
          impressions: 60000,
          reach: 30000,
          clicks: 1500,
          ctr: 2.5,
        },
        {
          campaignId: "camp_2",
          campaignName: "Campaign 2",
          spend: 2000,
          impressions: 40000,
          reach: 20000,
          clicks: 1000,
          ctr: 2.5,
        },
      ],
      dateStart: "2025-12-01",
      dateEnd: "2025-12-31",
      fetchedAt: new Date(),
    };

    it("should normalize Meta Ads data to unified format", () => {
      const result = normalizeMetaData(mockMetaData, testPeriod);

      expect(result.platform).toBe("meta");
      expect(result.metrics.spend).toBe(5000);
      expect(result.metrics.impressions).toBe(100000);
      expect(result.metrics.reach).toBe(50000);
      expect(result.metrics.clicks).toBe(2500);
      expect(result.metrics.ctr).toBe(2.5);
      expect(result.campaigns).toHaveLength(2);
    });

    it("should include campaign data", () => {
      const result = normalizeMetaData(mockMetaData, testPeriod);

      expect(result.campaigns?.[0].name).toBe("Campaign 1");
      expect(result.campaigns?.[0].metrics.spend).toBe(3000);
    });
  });

  describe("normalizeGA4Data", () => {
    const mockGA4Data: GA4Data = {
      propertyId: "123456",
      pageviews: 50000,
      sessions: 20000,
      users: 15000,
      newUsers: 5000,
      engagementRate: 0.65,
      bounceRate: 0.35,
      avgSessionDuration: 180,
      topPages: [],
      topSources: [],
      dateStart: "2025-12-01",
      dateEnd: "2025-12-31",
      fetchedAt: new Date(),
    };

    it("should normalize GA4 data to unified format", () => {
      const result = normalizeGA4Data(mockGA4Data, testPeriod);

      expect(result.platform).toBe("ga4");
      expect(result.metrics.impressions).toBe(50000); // pageviews
      expect(result.metrics.reach).toBe(15000); // users
      expect(result.metrics.clicks).toBe(20000); // sessions
      expect(result.metrics.ctr).toBe(65); // engagement rate as %
    });

    it("should include platform-specific data", () => {
      const result = normalizeGA4Data(mockGA4Data, testPeriod);

      expect(result.metrics.platformSpecific?.bounceRate).toBe(0.35);
      expect(result.metrics.platformSpecific?.avgSessionDuration).toBe(180);
    });
  });

  describe("normalizeEquals5Data", () => {
    const mockEquals5Data: Equals5Data = {
      impressions: 80000,
      identifiedImpressions: 60000,
      clicks: 4000,
      identifiedClicks: 3000,
      avgCtr: 5.0,
      reach: 40000,
      visitsMedia: 2000,
      clicksMedia: 1500,
      signals: 10000,
      spend: 3500,
      dateStart: new Date("2025-12-01"),
      dateEnd: new Date("2025-12-31"),
      extractedAt: new Date(),
    };

    it("should normalize Equals5 data to unified format", () => {
      const result = normalizeEquals5Data(mockEquals5Data, testPeriod);

      expect(result.platform).toBe("equals5");
      expect(result.metrics.spend).toBe(3500);
      expect(result.metrics.impressions).toBe(80000);
      expect(result.metrics.clicks).toBe(4000);
      expect(result.metrics.ctr).toBe(5.0);
    });

    it("should include platform-specific data", () => {
      const result = normalizeEquals5Data(mockEquals5Data, testPeriod);

      expect(result.metrics.platformSpecific?.identifiedImpressions).toBe(60000);
      expect(result.metrics.platformSpecific?.signals).toBe(10000);
    });
  });

  describe("aggregateMetrics", () => {
    const mockPlatforms: Partial<Record<"meta" | "ga4" | "equals5", PlatformData>> = {
      meta: {
        platform: "meta",
        period: testPeriod,
        metrics: {
          spend: 5000,
          impressions: 100000,
          reach: 50000,
          clicks: 2500,
          ctr: 2.5,
        },
        fetchedAt: new Date(),
      },
      ga4: {
        platform: "ga4",
        period: testPeriod,
        metrics: {
          impressions: 50000,
          reach: 15000,
          clicks: 20000,
          ctr: 40,
        },
        fetchedAt: new Date(),
      },
    };

    it("should aggregate metrics across platforms", () => {
      const result = aggregateMetrics(mockPlatforms);

      expect(result.totalSpend).toBe(5000);
      expect(result.totalImpressions).toBe(150000);
      expect(result.totalReach).toBe(65000);
      expect(result.totalClicks).toBe(22500);
    });

    it("should calculate overall CTR", () => {
      const result = aggregateMetrics(mockPlatforms);

      // CTR = (22500 / 150000) * 100 = 15%
      expect(result.overallCtr).toBe(15);
    });

    it("should calculate platform percentages", () => {
      const result = aggregateMetrics(mockPlatforms);

      const metaPlatform = result.byPlatform.find((p) => p.platform === "meta");
      const ga4Platform = result.byPlatform.find((p) => p.platform === "ga4");

      // Meta: 100000/150000 = 66.67%
      expect(metaPlatform?.percentOfTotal).toBeCloseTo(66.67, 1);
      // GA4: 50000/150000 = 33.33%
      expect(ga4Platform?.percentOfTotal).toBeCloseTo(33.33, 1);
    });
  });

  describe("calculatePercentChange", () => {
    it("should calculate positive percent change", () => {
      const result = calculatePercentChange(150, 100);

      expect(result.current).toBe(150);
      expect(result.previous).toBe(100);
      expect(result.change).toBe(50);
      expect(result.percentChange).toBe(50);
      expect(result.direction).toBe("up");
    });

    it("should calculate negative percent change", () => {
      const result = calculatePercentChange(80, 100);

      expect(result.change).toBe(-20);
      expect(result.percentChange).toBe(-20);
      expect(result.direction).toBe("down");
    });

    it("should handle zero previous value", () => {
      const result = calculatePercentChange(100, 0);

      expect(result.percentChange).toBe(100);
      expect(result.direction).toBe("up");
    });

    it("should handle unchanged values", () => {
      const result = calculatePercentChange(100, 100);

      expect(result.change).toBe(0);
      expect(result.percentChange).toBe(0);
      expect(result.direction).toBe("unchanged");
    });
  });

  describe("getMonthPeriod", () => {
    it("should return correct period for December 2025", () => {
      const result = getMonthPeriod(2025, 11); // December (0-indexed)

      expect(result.label).toBe("December 2025");
      expect(result.startDate.getDate()).toBe(1);
      expect(result.endDate.getDate()).toBe(31);
    });

    it("should handle February correctly", () => {
      const result = getMonthPeriod(2025, 1); // February

      expect(result.label).toBe("February 2025");
      expect(result.endDate.getDate()).toBe(28);
    });
  });

  describe("getPreviousMonthPeriod", () => {
    it("should return previous month", () => {
      const december = getMonthPeriod(2025, 11);
      const result = getPreviousMonthPeriod(december);

      expect(result.label).toBe("November 2025");
    });

    it("should handle year rollover", () => {
      const january = getMonthPeriod(2026, 0);
      const result = getPreviousMonthPeriod(january);

      expect(result.label).toBe("December 2025");
    });
  });

  describe("buildClientReportData", () => {
    const mockMetaData: MetaAdsData = {
      accountId: "act_123",
      spend: 5000,
      impressions: 100000,
      reach: 50000,
      clicks: 2500,
      ctr: 2.5,
      campaigns: [],
      dateStart: "2025-12-01",
      dateEnd: "2025-12-31",
      fetchedAt: new Date(),
    };

    it("should build complete report data", () => {
      const result = buildClientReportData({
        clientId: "client_1",
        clientName: "Test Client",
        period: testPeriod,
        metaData: mockMetaData,
      });

      expect(result.clientId).toBe("client_1");
      expect(result.clientName).toBe("Test Client");
      expect(result.period.label).toBe("December 2025");
      expect(result.platforms.meta).toBeDefined();
      expect(result.totals.totalSpend).toBe(5000);
    });

    it("should include comparison when previous data provided", () => {
      const previousPeriod = getMonthPeriod(2025, 10); // November

      const previousMetaData: MetaAdsData = {
        ...mockMetaData,
        spend: 4000,
        impressions: 80000,
      };

      const result = buildClientReportData({
        clientId: "client_1",
        clientName: "Test Client",
        period: testPeriod,
        previousPeriod,
        metaData: mockMetaData,
        previousMetaData,
      });

      expect(result.comparison).toBeDefined();
      expect(result.comparison?.spendChange.percentChange).toBe(25); // 5000 vs 4000
    });
  });
});
