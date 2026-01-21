# CLAUDE.md - AI Assistant Context

This file provides context for AI assistants (Claude, Copilot, etc.) working on this codebase.

---

## Project Overview

**Name:** Digital Marketing Reporting System (DMRS)
**Purpose:** Automate collection of marketing data from multiple platforms and generate branded client reports.
**Status:** Planning/Pre-development

---

## What This System Does

1. **Collects data** from three marketing platforms:
   - Meta Ads (Facebook/Instagram advertising) - via API
   - Google Analytics 4 - via API
   - Equals 5 (no API) - via browser automation (BrowserMCP)

2. **Retrieves screenshots** from client Google Drive folders

3. **Generates reports** in two formats:
   - Google Slides (primary) - with charts, data, screenshots
   - XLSX (Excel) - data export

4. **Manages workflow**:
   - Analyst generates/reviews report
   - Manager approves
   - Report delivered to client's Google Drive folder

---

## Key Documents

| File | Purpose |
|------|---------|
| `product.md` | Full Product Requirements Document (PRD) |
| `EPIC.md` | High-level epic and user stories |
| `FEATURES.md` | Detailed feature specifications |
| `PLAN.md` | Implementation plan and architecture |
| `CLAUDE.md` | This file - AI context |

**Always read these files before making significant changes.**

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14+ (App Router) |
| Backend | Next.js API Routes / Node.js |
| Database | PostgreSQL |
| Browser Automation | Playwright via BrowserMCP |
| Cloud | Google Cloud Platform (recommended) |
| Auth | Google OAuth / Google SSO |

---

## Project Structure

```
src/
├── app/                      # Next.js app router
│   ├── (auth)/              # Authentication routes
│   ├── (dashboard)/         # Main dashboard
│   │   ├── clients/         # Client management
│   │   ├── reports/         # Report management
│   │   ├── templates/       # Template management
│   │   └── settings/        # Settings
│   └── api/                 # API routes
│
├── components/              # React components
├── lib/                     # Core business logic
│   ├── db/                  # Database layer
│   ├── integrations/        # External APIs
│   │   ├── meta/           # Meta Ads API
│   │   ├── google/         # Google APIs (GA4, Drive, Slides)
│   │   └── equals5/        # BrowserMCP automation
│   └── reports/            # Report generation
│
├── types/                   # TypeScript definitions
└── config/                  # Configuration
```

---

## Key Concepts

### Clients
Each client represents a company receiving monthly reports. Clients have:
- Platform configurations (which platforms they use)
- Branding (logo, colors)
- Google Drive folders (screenshots input, report output)
- Report template assignment

### Data Flow
```
Meta Ads API ──────┐
Google Analytics ──┼──► Data Storage ──► Report Generator ──► Google Slides
Equals 5 (Browser)─┘                                      └─► XLSX
Screenshots (Drive)────────────────────────────────────────┘
```

### Report Workflow
```
Draft → In Review → Approved → Delivered
         ↓
      Rejected → Draft
```

### BrowserMCP (Equals 5)
Since Equals 5 has no API, we use browser automation:
1. Launch headless browser
2. Log in with stored credentials
3. Navigate to export section
4. Download/scrape data
5. Parse and store

**This is the highest-risk component - handle with care.**

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `clients` | Client profiles and configuration |
| `credentials` | Encrypted Equals 5 credentials |
| `meta_ads_data` | Fetched Meta Ads metrics |
| `ga_data` | Fetched Google Analytics metrics |
| `equals5_data` | Fetched Equals 5 metrics |
| `reports` | Report metadata and status |
| `report_status_history` | Audit trail |
| `templates` | Google Slides templates |
| `users` | System users |

---

## Important Patterns

### Error Handling
- All API calls should have retry logic
- BrowserMCP automation needs screenshot-on-failure
- Never expose credentials in logs or errors

### Data Fetching
- Always store fetched data with timestamps
- Support date range queries for MoM comparisons
- Cache where appropriate to avoid rate limits

### Report Generation
- Use template placeholders: `{{METRIC_NAME}}`
- Process screenshots before insertion (resize if needed)
- Handle missing data gracefully (show "N/A" not errors)

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Meta OAuth
META_APP_ID=
META_APP_SECRET=

# Encryption (for credentials)
ENCRYPTION_KEY=

# Email (notifications)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```

---

## Common Tasks

### Adding a new metric
1. Update data model in `lib/db/schema.ts`
2. Update connector in `lib/integrations/`
3. Add to report generator in `lib/reports/`
4. Update template placeholder mapping

### Adding a new platform
1. Create connector in `lib/integrations/{platform}/`
2. Add data table migration
3. Add to client configuration options
4. Update report generator to include data

### Debugging Equals 5 automation
1. Check `equals5_data` table for `extraction_status`
2. Look at `debug_screenshot_path` for failure screenshots
3. Test manually with headful browser first
4. Check for UI changes on Equals 5 platform

---

## Testing Approach

- Unit tests for data processing and calculations
- Integration tests for API connectors
- E2E tests for report generation flow
- Manual testing for BrowserMCP automation

---

## What NOT to Do

- Never commit credentials or API keys
- Never log sensitive data (passwords, tokens)
- Don't skip error handling for integrations
- Don't assume Equals 5 UI is stable
- Don't generate reports without all required data (fail explicitly)

---

## Helpful Commands

```bash
# Development
npm run dev              # Start dev server
npm run db:migrate       # Run migrations
npm run db:seed          # Seed test data

# Testing
npm run test             # Run all tests
npm run test:e2e         # Run E2E tests

# Equals 5 debugging
npm run equals5:test     # Test automation with headful browser
```

---

## Questions to Ask Before Coding

1. Does this change affect the report output?
2. Does this touch Equals 5 automation? (high risk)
3. Does this require a database migration?
4. Does this affect multiple clients or just one?
5. Is there error handling for all external calls?

---

## Key Contacts

| Role | Responsibility |
|------|----------------|
| Product Owner | Requirements, priorities, acceptance |
| Tech Lead | Architecture decisions, code review |
| Account Managers | Domain knowledge, testing |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial document |

---

*Keep this file updated as the project evolves.*
