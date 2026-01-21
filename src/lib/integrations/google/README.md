# Google Integrations

This folder contains connectors for Google APIs.

## Services

### Google Analytics 4
- `ga4/client.ts` - GA4 Data API client
- `ga4/fetch.ts` - Data fetching

### Google Drive
- `drive/client.ts` - Drive API client
- `drive/screenshots.ts` - Screenshot retrieval
- `drive/upload.ts` - Report upload

### Google Slides
- `slides/client.ts` - Slides API client
- `slides/generator.ts` - Report generation
- `slides/templates.ts` - Template handling

## API References

- GA4 Data API: https://developers.google.com/analytics/devguides/reporting/data/v1
- Drive API: https://developers.google.com/drive/api/v3/reference
- Slides API: https://developers.google.com/slides/api/reference/rest

## Authentication

All Google APIs use OAuth 2.0 with these scopes:
- `https://www.googleapis.com/auth/analytics.readonly`
- `https://www.googleapis.com/auth/drive`
- `https://www.googleapis.com/auth/presentations`
