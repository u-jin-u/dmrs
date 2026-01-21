# FEATURES.md - Detailed Feature Specifications

**Document Version:** 1.0
**Last Updated:** January 2026
**Status:** Draft - Pending Specialist Review

---

## Feature Index

| ID | Feature | Priority | Complexity | Status |
|----|---------|----------|------------|--------|
| F01 | Meta Ads Integration | Must Have | Medium | Not Started |
| F02 | Google Analytics Integration | Must Have | Medium | Not Started |
| F03 | Equals 5 Browser Automation | Must Have | High | Not Started |
| F04 | Screenshot Management | Must Have | Low | Not Started |
| F05 | Google Slides Report Generator | Must Have | High | Not Started |
| F06 | XLSX Report Generator | Must Have | Medium | Not Started |
| F07 | Client Management | Must Have | Medium | Not Started |
| F08 | Template Management | Must Have | Medium | Not Started |
| F09 | Approval Workflow | Must Have | Medium | Not Started |
| F10 | Notification System | Must Have | Low | Not Started |
| F11 | Credential Vault | Must Have | Medium | Not Started |
| F12 | Data Storage & History | Must Have | Medium | Not Started |

---

## F01: Meta Ads Integration

### Description
Connect to Meta Marketing API to pull advertising performance data for client accounts.

### User Story
> As an analyst, I want the system to automatically fetch Meta Ads data so that I don't have to manually export and copy metrics.

### Acceptance Criteria
- [ ] OAuth 2.0 authentication with Meta
- [ ] Fetch data for configured date range (current month, previous month)
- [ ] Retrieve metrics: Spend, Impressions, Reach, Clicks, CTR
- [ ] Support multiple ad accounts per client
- [ ] Store data in database with timestamp
- [ ] Handle API rate limits gracefully
- [ ] Log all API calls for debugging

### Data Model
```
MetaAdsData {
  id: UUID
  client_id: UUID
  account_id: String
  date_range_start: Date
  date_range_end: Date
  spend: Decimal
  impressions: Integer
  reach: Integer
  clicks: Integer
  ctr: Decimal
  campaigns: JSON (campaign-level breakdown)
  fetched_at: Timestamp
}
```

### API Reference
- Meta Marketing API v18.0+
- Endpoints: `/act_{ad_account_id}/insights`

### Technical Notes
- Use long-lived tokens with refresh mechanism
- Implement exponential backoff for rate limits
- Cache data to avoid redundant calls

---

## F02: Google Analytics Integration

### Description
Connect to GA4 Data API to pull website/app analytics data for client properties.

### User Story
> As an analyst, I want the system to automatically fetch Google Analytics data so that I have complete marketing performance in one place.

### Acceptance Criteria
- [ ] OAuth 2.0 authentication with Google
- [ ] Fetch data for configured date range
- [ ] Retrieve metrics: Sessions, Users, Conversions, Traffic sources
- [ ] Support multiple GA4 properties per client
- [ ] Store data in database with timestamp
- [ ] Handle API quota limits

### Data Model
```
GAData {
  id: UUID
  client_id: UUID
  property_id: String
  date_range_start: Date
  date_range_end: Date
  sessions: Integer
  users: Integer
  new_users: Integer
  conversions: Integer
  traffic_sources: JSON
  fetched_at: Timestamp
}
```

### API Reference
- GA4 Data API v1
- Method: `runReport`

### Technical Notes
- Use service account or OAuth depending on setup
- Batch requests where possible

---

## F03: Equals 5 Browser Automation

### Description
Use BrowserMCP to automate login and data extraction from Equals 5 platform which has no API.

### User Story
> As an analyst, I want Equals 5 data pulled automatically so that I don't need to manually export and upload files.

### Acceptance Criteria
- [ ] Automated login to Equals 5 with stored credentials
- [ ] Navigate to reporting/data export section
- [ ] Download XLSX or scrape data directly
- [ ] Parse extracted data into standard format
- [ ] Handle session timeouts and re-authentication
- [ ] Retry failed extractions (max 3 attempts)
- [ ] Capture screenshot on failure for debugging
- [ ] Alert on extraction failure
- [ ] Support MFA if required (manual intervention flow)

### Automation Flow
```
1. Launch headless browser
2. Navigate to Equals 5 login page
3. Enter credentials (from secure vault)
4. Handle MFA if prompted (pause for manual entry or TOTP)
5. Navigate to Reports → Export
6. Select date range (current month)
7. Click Export / Download XLSX
8. Wait for download completion
9. Parse XLSX file
10. Store data in database
11. Close browser session
```

### Data Model
```
Equals5Data {
  id: UUID
  client_id: UUID
  date_range_start: Date
  date_range_end: Date
  raw_data: JSON (all metrics from export)
  spend: Decimal (extracted)
  impressions: Integer (extracted)
  clicks: Integer (extracted)
  extraction_status: Enum (success, failed, pending)
  error_message: String (nullable)
  screenshot_path: String (nullable, on failure)
  fetched_at: Timestamp
}
```

### Technical Notes
- Use Playwright or Puppeteer via BrowserMCP
- Run in isolated container/environment
- Add random delays to mimic human behavior
- Rotate user agents if needed
- Store credentials encrypted (see F11)

### Risks
- UI changes can break automation
- Platform may block automation
- MFA adds complexity

---

## F04: Screenshot Management

### Description
Retrieve screenshots from designated Google Drive folders and prepare them for insertion into reports.

### User Story
> As an account manager, I want screenshots I upload to Drive to automatically appear in the client report.

### Acceptance Criteria
- [ ] Read images from client's screenshot folder on Google Drive
- [ ] Support PNG, JPG, GIF formats
- [ ] List available screenshots for report period
- [ ] Download images for insertion into Slides
- [ ] Handle missing screenshots gracefully (skip or placeholder)
- [ ] Support naming convention for slide mapping (optional)

### Folder Structure
```
Google Drive/
└── Clients/
    └── {ClientName}/
        └── Screenshots/
            └── 2026-01/
                ├── hero-banner.png
                ├── campaign-1.jpg
                └── results-chart.png
```

### Data Model
```
Screenshot {
  id: UUID
  client_id: UUID
  report_period: String (YYYY-MM)
  filename: String
  drive_file_id: String
  slide_mapping: String (nullable, e.g., "slide_3")
  downloaded_path: String (temp local path)
}
```

### Technical Notes
- Use Google Drive API v3
- Download to temp storage during report generation
- Clean up temp files after report complete

---

## F05: Google Slides Report Generator

### Description
Generate branded client reports in Google Slides format using templates and populated data.

### User Story
> As an analyst, I want the system to generate a complete Slides report with all data and screenshots so that I only need to add the executive summary.

### Acceptance Criteria
- [ ] Copy client's template to create new report
- [ ] Replace data placeholders with actual metrics
- [ ] Insert charts/graphs for key metrics
- [ ] Insert screenshots at designated positions
- [ ] Apply month-over-month calculations and display
- [ ] Apply client branding (logo, colors)
- [ ] Save report to designated output folder
- [ ] Support all report sections defined in PRD

### Template Placeholder System
```
Placeholders in template:
{{CLIENT_NAME}}
{{REPORT_PERIOD}}
{{TOTAL_SPEND}}
{{TOTAL_IMPRESSIONS}}
{{TOTAL_CLICKS}}
{{CTR}}
{{SPEND_MOM_CHANGE}}
{{IMPRESSIONS_MOM_CHANGE}}
{{SCREENSHOT_1}}
{{SCREENSHOT_2}}
{{CHART_SPEND_TREND}}
{{TABLE_CAMPAIGN_BREAKDOWN}}
```

### Report Sections
1. Title Slide (client name, period, branding)
2. Executive Summary (placeholder for manual entry)
3. Spend Overview (total spend, budget utilization, MoM)
4. Performance Metrics (impressions, reach, clicks, CTR)
5. Platform Breakdown (Meta vs GA vs Equals 5)
6. Campaign Details (table with campaign-level data)
7. Screenshots (inserted from Drive)

### Technical Notes
- Use Google Slides API
- Use Google Sheets API for embedded charts (if needed)
- Template stored as master Slides document per client

---

## F06: XLSX Report Generator

### Description
Generate client reports in Excel format as alternative to Slides.

### User Story
> As an analyst, I want an Excel version of the report for clients who prefer spreadsheet format.

### Acceptance Criteria
- [ ] Generate XLSX with all report data
- [ ] Include summary sheet with key metrics
- [ ] Include detailed sheets per platform
- [ ] Include campaign breakdown sheet
- [ ] Apply basic formatting and branding
- [ ] Include MoM comparison columns
- [ ] Save to designated output folder

### Sheet Structure
```
Sheet 1: Summary
- Key metrics with MoM comparison
- Totals across platforms

Sheet 2: Meta Ads Detail
- Campaign-level breakdown

Sheet 3: Google Analytics Detail
- Traffic and conversion data

Sheet 4: Equals 5 Detail
- All Equals 5 metrics

Sheet 5: Raw Data
- All raw data for reference
```

### Technical Notes
- Use library like ExcelJS, openpyxl, or similar
- Template-based generation preferred

---

## F07: Client Management

### Description
CRUD operations for managing client profiles, platform configurations, and folder assignments.

### User Story
> As a manager, I want to add and configure clients so that the system knows which data to fetch and how to generate their reports.

### Acceptance Criteria
- [ ] Create new client profile
- [ ] Edit client details
- [ ] Delete/archive client
- [ ] Assign platforms to client (Meta, GA, Equals 5)
- [ ] Configure platform credentials/connections
- [ ] Set Google Drive folders (screenshots, delivery)
- [ ] Assign report template
- [ ] Upload client branding assets (logo, colors)

### Data Model
```
Client {
  id: UUID
  name: String
  industry: String (Pharma, Media Agency)
  status: Enum (active, inactive)

  // Platform configs
  meta_ads_account_ids: String[]
  ga4_property_ids: String[]
  equals5_enabled: Boolean
  equals5_credential_id: UUID (FK to Credentials)

  // Google Drive
  screenshot_folder_id: String
  delivery_folder_id: String

  // Branding
  logo_url: String
  primary_color: String
  secondary_color: String

  // Template
  slides_template_id: String

  created_at: Timestamp
  updated_at: Timestamp
}
```

### UI Screens
1. Client List (table with search/filter)
2. Client Detail / Edit Form
3. Platform Connection Wizard
4. Branding Upload

---

## F08: Template Management

### Description
Create and manage Google Slides templates with placeholders for report generation.

### User Story
> As a manager, I want to create and modify report templates so that each client gets a properly branded report.

### Acceptance Criteria
- [ ] Create new template from scratch or copy existing
- [ ] Define placeholder positions for data
- [ ] Define screenshot placeholder positions
- [ ] Preview template with sample data
- [ ] Assign template to clients
- [ ] Version templates (keep history)

### Template Configuration
```
Template {
  id: UUID
  name: String
  slides_document_id: String
  placeholders: JSON {
    "{{TOTAL_SPEND}}": { slide: 3, element_id: "abc123" },
    "{{SCREENSHOT_1}}": { slide: 5, element_id: "def456", type: "image" }
  }
  created_at: Timestamp
  updated_at: Timestamp
}
```

---

## F09: Approval Workflow

### Description
Workflow for report review, approval, and delivery.

### User Story
> As a manager, I want to review and approve reports before they go to clients so that we maintain quality control.

### Acceptance Criteria
- [ ] Report status tracking (Draft → In Review → Approved → Delivered)
- [ ] Analyst submits report for review
- [ ] Manager receives notification
- [ ] Manager can approve or reject with comments
- [ ] Rejected reports return to analyst
- [ ] Approved reports can be delivered
- [ ] Audit trail of status changes

### Workflow States
```
Draft → [Submit] → In Review → [Approve] → Approved → [Deliver] → Delivered
                         ↓
                    [Reject]
                         ↓
                      Draft (with comments)
```

### Data Model
```
Report {
  id: UUID
  client_id: UUID
  period: String (YYYY-MM)
  status: Enum (draft, in_review, approved, delivered)
  slides_url: String
  xlsx_url: String
  executive_summary: Text (manual entry)

  submitted_by: UUID (User)
  submitted_at: Timestamp
  reviewed_by: UUID (User)
  reviewed_at: Timestamp
  rejection_reason: Text (nullable)
  delivered_at: Timestamp

  created_at: Timestamp
  updated_at: Timestamp
}
```

---

## F10: Notification System

### Description
Send notifications when reports are ready for review.

### User Story
> As a manager, I want to be notified when reports are ready for my approval so that I don't miss the review deadline.

### Acceptance Criteria
- [ ] Email notification when report submitted for review
- [ ] Email includes: client name, report period, link to report
- [ ] Configurable notification recipients per client
- [ ] (Optional) Slack integration

### Email Template
```
Subject: Report Ready for Review - {ClientName} - {Period}

Hi {ManagerName},

A new report is ready for your review:

Client: {ClientName}
Period: {Period}
Submitted by: {AnalystName}

Review the report: {SlidesURL}

Approve or reject in the dashboard: {DashboardURL}
```

---

## F11: Credential Vault

### Description
Secure storage for Equals 5 credentials and API tokens.

### User Story
> As an admin, I want credentials stored securely so that we protect client account access.

### Acceptance Criteria
- [ ] Encrypt credentials at rest
- [ ] Access control (only automation service reads)
- [ ] Audit log of credential access
- [ ] Support credential rotation
- [ ] Admin UI to add/update credentials

### Data Model
```
Credential {
  id: UUID
  client_id: UUID
  platform: Enum (equals5)
  username: String (encrypted)
  password: String (encrypted)
  mfa_secret: String (encrypted, nullable)
  last_used: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}
```

### Technical Notes
- Use cloud secret manager (AWS Secrets Manager, GCP Secret Manager)
- Or self-hosted vault (HashiCorp Vault)
- Never log credentials

---

## F12: Data Storage & History

### Description
Store historical data for trend analysis and month-over-month comparisons.

### User Story
> As an analyst, I want historical data stored so that reports can show month-over-month comparisons.

### Acceptance Criteria
- [ ] Store all fetched data with timestamps
- [ ] Query data by client and date range
- [ ] Calculate MoM changes automatically
- [ ] Data retention policy (configurable)
- [ ] Export raw data if needed

### Technical Notes
- Time-series optimized storage recommended
- Index by client_id + date for fast queries
- Consider data warehouse for analytics (future)

---

## Specialist Review Checklist

### Backend Engineer
- [ ] Review API integration feasibility
- [ ] Confirm data models
- [ ] Estimate complexity
- [ ] Identify technical risks

### Frontend Engineer
- [ ] Review UI requirements
- [ ] Confirm screens needed
- [ ] Estimate complexity

### DevOps Engineer
- [ ] Review infrastructure needs
- [ ] Browser automation environment
- [ ] Secret management approach
- [ ] CI/CD requirements

### Security Review
- [ ] Credential storage approach
- [ ] OAuth token handling
- [ ] Data encryption requirements
- [ ] Access control model

---

*This document should be reviewed and enriched by technical specialists before development begins.*
