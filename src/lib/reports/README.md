# Report Generation

This folder contains the report generation engine.

## Files to Create

- `generator.ts` - Main report orchestration
- `slides.ts` - Google Slides generation
- `xlsx.ts` - Excel generation
- `charts.ts` - Chart/graph preparation
- `aggregator.ts` - Cross-platform data aggregation
- `comparisons.ts` - MoM calculation logic
- `templates.ts` - Template placeholder handling

## Report Sections

1. **Title Slide** - Client name, period, branding
2. **Executive Summary** - Manual entry (placeholder)
3. **Spend Overview** - Budget and spend metrics
4. **Performance Metrics** - Impressions, clicks, CTR (combined)
5. **Platform Breakdown** - Per-platform metrics
6. **Campaign Details** - Campaign-level table
7. **Screenshots** - Images from Drive

## Placeholder System

Templates use `{{PLACEHOLDER}}` syntax:

```
{{CLIENT_NAME}}
{{REPORT_PERIOD}}
{{TOTAL_SPEND}}
{{TOTAL_IMPRESSIONS}}
{{TOTAL_CLICKS}}
{{CTR}}
{{SPEND_MOM_CHANGE}}
{{SPEND_MOM_PERCENT}}
{{SCREENSHOT_1}}
{{CHART_SPEND_TREND}}
```

## Data Aggregation

```typescript
// Combined metrics across platforms
interface AggregatedMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;  // calculated

  // MoM comparison
  previousPeriod: {
    spend: number;
    impressions: number;
    clicks: number;
  };

  momChange: {
    spend: number;      // absolute
    spendPercent: number;
    impressions: number;
    impressionsPercent: number;
  };
}
```

## Output

- Google Slides document (copied from template)
- XLSX file with multiple sheets
- Both saved to client's delivery folder on Drive
