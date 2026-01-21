/**
 * Chart Data Preparation Tests
 */

import { describe, it, expect } from "vitest";
import {
  buildSpendByPlatformChart,
  buildImpressionsByPlatformChart,
  buildMoMComparisonChart,
  buildCtrByPlatformChart,
  buildPlatformBreakdownChart,
  buildPerformanceIndicators,
  buildAllCharts,
  formatMetricsForDisplay,
} from "../charts";
import { ClientReportData, MetricsComparison, AggregatedMetrics } from "../types";

describe("Chart Data Preparation", () => {
  const mockReportData: ClientReportData = {
    clientId: "client_1",
    clientName: "Test Client",
    period: {
      startDate: new Date("2025-12-01"),
      endDate: new Date("2025-12-31"),
      label: "December 2025",
    },
    previousPeriod: {
      startDate: new Date("2025-11-01"),
      endDate: new Date("2025-11-30"),
      label: "November 2025",
    },
    platforms: {},
    totals: {
      totalSpend: 10000,
      totalImpressions: 200000,
      totalReach: 100000,
      totalClicks: 5000,
      overallCtr: 2.5,
      byPlatform: [
        {
          platform: "meta",
          spend: 6000,
          impressions: 120000,
          reach: 60000,
          clicks: 3000,
          ctr: 2.5,
          percentOfTotal: 60,
        },
        {
          platform: "ga4",
          spend: 0,
          impressions: 50000,
          reach: 25000,
          clicks: 1500,
          ctr: 3.0,
          percentOfTotal: 25,
        },
        {
          platform: "equals5",
          spend: 4000,
          impressions: 30000,
          reach: 15000,
          clicks: 500,
          ctr: 1.67,
          percentOfTotal: 15,
        },
      ],
    },
    comparison: {
      currentPeriod: {
        startDate: new Date("2025-12-01"),
        endDate: new Date("2025-12-31"),
        label: "December 2025",
      },
      previousPeriod: {
        startDate: new Date("2025-11-01"),
        endDate: new Date("2025-11-30"),
        label: "November 2025",
      },
      spendChange: {
        current: 10000,
        previous: 8000,
        change: 2000,
        percentChange: 25,
        direction: "up",
      },
      impressionsChange: {
        current: 200000,
        previous: 180000,
        change: 20000,
        percentChange: 11.1,
        direction: "up",
      },
      reachChange: {
        current: 100000,
        previous: 90000,
        change: 10000,
        percentChange: 11.1,
        direction: "up",
      },
      clicksChange: {
        current: 5000,
        previous: 4500,
        change: 500,
        percentChange: 11.1,
        direction: "up",
      },
      ctrChange: {
        current: 2.5,
        previous: 2.5,
        change: 0,
        percentChange: 0,
        direction: "unchanged",
      },
      byPlatform: [],
    },
    generatedAt: new Date(),
  };

  describe("buildSpendByPlatformChart", () => {
    it("should build pie chart data for spend", () => {
      const result = buildSpendByPlatformChart(mockReportData);

      expect(result.type).toBe("pie");
      expect(result.title).toBe("Spend by Platform");
      expect(result.labels).toContain("Meta Ads");
      expect(result.labels).toContain("Equals 5");
      // GA4 has $0 spend so should not be included
      expect(result.labels).not.toContain("Google Analytics");
    });

    it("should only include platforms with spend > 0", () => {
      const result = buildSpendByPlatformChart(mockReportData);

      expect(result.datasets[0].data).toHaveLength(2);
      expect(result.datasets[0].data).toContain(6000);
      expect(result.datasets[0].data).toContain(4000);
    });
  });

  describe("buildImpressionsByPlatformChart", () => {
    it("should build bar chart data for impressions", () => {
      const result = buildImpressionsByPlatformChart(mockReportData);

      expect(result.type).toBe("bar");
      expect(result.title).toBe("Impressions by Platform");
      expect(result.labels).toHaveLength(3);
      expect(result.datasets[0].data).toContain(120000);
      expect(result.datasets[0].data).toContain(50000);
      expect(result.datasets[0].data).toContain(30000);
    });
  });

  describe("buildMoMComparisonChart", () => {
    it("should build comparison chart when data available", () => {
      const result = buildMoMComparisonChart(mockReportData);

      expect(result).not.toBeNull();
      expect(result?.type).toBe("bar");
      expect(result?.datasets).toHaveLength(2);
      expect(result?.datasets[0].label).toBe("December 2025");
      expect(result?.datasets[1].label).toBe("November 2025");
    });

    it("should return null when no comparison data", () => {
      const dataWithoutComparison = { ...mockReportData, comparison: undefined };
      const result = buildMoMComparisonChart(dataWithoutComparison);

      expect(result).toBeNull();
    });
  });

  describe("buildCtrByPlatformChart", () => {
    it("should build bar chart for CTR", () => {
      const result = buildCtrByPlatformChart(mockReportData);

      expect(result.type).toBe("bar");
      expect(result.title).toBe("Click-Through Rate by Platform");
      expect(result.datasets[0].label).toBe("CTR %");
    });
  });

  describe("buildPlatformBreakdownChart", () => {
    it("should build donut chart for platform breakdown", () => {
      const result = buildPlatformBreakdownChart(mockReportData);

      expect(result.type).toBe("donut");
      expect(result.title).toBe("Impression Share by Platform");
      expect(result.datasets[0].data).toContain(60);
      expect(result.datasets[0].data).toContain(25);
      expect(result.datasets[0].data).toContain(15);
    });
  });

  describe("buildPerformanceIndicators", () => {
    it("should build performance indicators from comparison", () => {
      const comparison = mockReportData.comparison!;
      const result = buildPerformanceIndicators(comparison);

      expect(result).toHaveLength(5);
      expect(result[0].metric).toBe("Total Spend");
      expect(result[0].current).toBe("$10,000");
      expect(result[0].change).toBe("+25.0%");
      expect(result[0].direction).toBe("up");
    });

    it("should mark spend increase as negative (lower is better)", () => {
      const comparison = mockReportData.comparison!;
      const result = buildPerformanceIndicators(comparison);

      const spendIndicator = result.find((r) => r.metric === "Total Spend");
      expect(spendIndicator?.isPositive).toBe(false); // Higher spend is not positive
    });

    it("should mark impressions increase as positive", () => {
      const comparison = mockReportData.comparison!;
      const result = buildPerformanceIndicators(comparison);

      const impressionsIndicator = result.find((r) => r.metric === "Impressions");
      expect(impressionsIndicator?.isPositive).toBe(true);
    });
  });

  describe("buildAllCharts", () => {
    it("should build all chart types", () => {
      const result = buildAllCharts(mockReportData);

      expect(result.spendByPlatform).toBeDefined();
      expect(result.impressionsByPlatform).toBeDefined();
      expect(result.momComparison).toBeDefined();
      expect(result.ctrByPlatform).toBeDefined();
      expect(result.platformBreakdown).toBeDefined();
    });
  });

  describe("formatMetricsForDisplay", () => {
    it("should format metrics with appropriate symbols", () => {
      const result = formatMetricsForDisplay(mockReportData.totals);

      expect(result.totalSpend).toBe("$10,000");
      expect(result.totalImpressions).toBe("200,000");
      expect(result.totalReach).toBe("100,000");
      expect(result.totalClicks).toBe("5,000");
      expect(result.overallCtr).toBe("2.50%");
    });
  });
});
