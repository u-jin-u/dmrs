import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  calculatePercentChange,
  getMonthDateRange,
  formatPeriod,
  parsePeriod,
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats large numbers", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });
});

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

describe("formatPercent", () => {
  it("formats decimal as percentage", () => {
    expect(formatPercent(0.1234)).toBe("12.34%");
  });

  it("respects decimal places", () => {
    expect(formatPercent(0.1, 0)).toBe("10%");
  });
});

describe("calculatePercentChange", () => {
  it("calculates positive change", () => {
    expect(calculatePercentChange(150, 100)).toBe(50);
  });

  it("calculates negative change", () => {
    expect(calculatePercentChange(50, 100)).toBe(-50);
  });

  it("handles zero previous value", () => {
    expect(calculatePercentChange(100, 0)).toBe(100);
  });

  it("handles both zero values", () => {
    expect(calculatePercentChange(0, 0)).toBe(0);
  });
});

describe("getMonthDateRange", () => {
  it("returns correct range for January", () => {
    const { start, end } = getMonthDateRange(2026, 1);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(0); // January
    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBe(31);
  });

  it("returns correct range for February in non-leap year", () => {
    const { end } = getMonthDateRange(2025, 2);
    expect(end.getDate()).toBe(28);
  });
});

describe("formatPeriod", () => {
  it("formats date as YYYY-MM", () => {
    const date = new Date(2026, 0, 15); // January 15, 2026
    expect(formatPeriod(date)).toBe("2026-01");
  });
});

describe("parsePeriod", () => {
  it("parses YYYY-MM to date range", () => {
    const { start, end } = parsePeriod("2026-01");
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(0);
    expect(end.getMonth()).toBe(0);
  });
});
