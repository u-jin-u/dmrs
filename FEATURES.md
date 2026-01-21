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

### User Stories

**US-F01-1: Connect Meta Ads Account**
> As a manager, I want to connect a client's Meta Ads account via OAuth so that we can fetch their advertising data.

**US-F01-2: Fetch Ad Performance Data**
> As an analyst, I want the system to automatically fetch Meta Ads data so that I don't have to manually export and copy metrics.

**US-F01-3: View Historical Data**
> As an analyst, I want to see current and previous month data so that I can include month-over-month comparisons in reports.

### Acceptance Criteria (Given/When/Then)

#### AC-F01-1: OAuth Connection
```gherkin
Given a manager is on the client configuration page
And the client does not have Meta Ads connected
When the manager clicks "Connect Meta Ads"
Then the system redirects to Meta OAuth consent screen
And upon approval, the ad account is linked to the client
And a success message is displayed
```

#### AC-F01-2: Successful Data Fetch
```gherkin
Given a client has Meta Ads connected with valid credentials
And the ad account has campaign data for January 2026
When the system fetches data for period "2026-01"
Then the following metrics are retrieved and stored:
  | Metric      | Type    |
  | Spend       | Decimal |
  | Impressions | Integer |
  | Reach       | Integer |
  | Clicks      | Integer |
  | CTR         | Decimal |
And campaign-level breakdown is stored as JSON
And fetched_at timestamp is recorded
```

#### AC-F01-3: Multiple Ad Accounts
```gherkin
Given a client has 3 Meta ad accounts configured
When the system fetches data for period "2026-01"
Then data is fetched for all 3 ad accounts
And each account's data is stored separately
And aggregated totals are available for reporting
```

#### AC-F01-4: Rate Limit Handling
```gherkin
Given the system is fetching Meta Ads data
When the Meta API returns a 429 (rate limit) error
Then the system waits for the specified retry-after duration
And retries the request with exponential backoff
And logs the rate limit event for monitoring
```

#### AC-F01-5: Token Refresh
```gherkin
Given a client's Meta access token has expired
When the system attempts to fetch data
Then the system automatically refreshes the token
And continues with the data fetch
And the new token is stored for future use
```

#### AC-F01-6: Connection Failure
```gherkin
Given a client's Meta connection is invalid (revoked permissions)
When the system attempts to fetch data
Then the fetch fails gracefully
And the client is marked as "Meta connection error"
And an alert is sent to the admin
```

#### AC-F01-7: No Data Available
```gherkin
Given a client has Meta Ads connected
But the ad account has no campaigns for the requested period
When the system fetches data for that period
Then an empty result is stored (zeros for metrics)
And no error is raised
```

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
- Scopes: `ads_read`, `ads_management`

### Technical Notes
- Use long-lived tokens with refresh mechanism
- Implement exponential backoff for rate limits
- Cache data to avoid redundant calls
- Store campaign-level data for detailed reports

---

## F02: Google Analytics Integration

### Description
Connect to GA4 Data API to pull website/app analytics data for client properties.

### User Stories

**US-F02-1: Connect Google Analytics Property**
> As a manager, I want to connect a client's GA4 property via OAuth so that we can fetch their website analytics.

**US-F02-2: Fetch Analytics Data**
> As an analyst, I want the system to automatically fetch Google Analytics data so that I have complete marketing performance in one place.

**US-F02-3: Traffic Source Breakdown**
> As an analyst, I want to see traffic sources so that I can understand where visitors come from.

### Acceptance Criteria (Given/When/Then)

#### AC-F02-1: OAuth Connection
```gherkin
Given a manager is on the client configuration page
And the client does not have Google Analytics connected
When the manager clicks "Connect Google Analytics"
Then the system redirects to Google OAuth consent screen
And upon approval, the GA4 property is linked to the client
And the property name is displayed in the client configuration
```

#### AC-F02-2: Successful Data Fetch
```gherkin
Given a client has Google Analytics connected with valid credentials
And the GA4 property has data for January 2026
When the system fetches data for period "2026-01"
Then the following metrics are retrieved and stored:
  | Metric      | Type    |
  | Sessions    | Integer |
  | Users       | Integer |
  | New Users   | Integer |
  | Conversions | Integer |
And traffic source breakdown is stored as JSON
And fetched_at timestamp is recorded
```

#### AC-F02-3: Traffic Sources Breakdown
```gherkin
Given a client has Google Analytics connected
When the system fetches data for a period
Then traffic sources are broken down by:
  | Dimension      | Example Values           |
  | Source/Medium  | google/organic, direct   |
  | Channel        | Organic Search, Paid     |
And each source includes session count and percentage
```

#### AC-F02-4: Multiple Properties
```gherkin
Given a client has 2 GA4 properties configured
When the system fetches data for period "2026-01"
Then data is fetched for both properties
And each property's data is stored separately
And aggregated totals are available for reporting
```

#### AC-F02-5: Quota Limit Handling
```gherkin
Given the system is fetching Google Analytics data
When the GA4 API returns a quota exceeded error
Then the system queues the request for later
And logs the quota event for monitoring
And retries after the quota reset window
```

#### AC-F02-6: Connection Revoked
```gherkin
Given a client's Google Analytics permission has been revoked
When the system attempts to fetch data
Then the fetch fails gracefully
And the client is marked as "GA connection error"
And an alert is sent to the admin
```

#### AC-F02-7: Property Has No Data
```gherkin
Given a client has Google Analytics connected
But the property has no traffic for the requested period
When the system fetches data for that period
Then an empty result is stored (zeros for metrics)
And no error is raised
```

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
  traffic_sources: JSON [
    { source: "google", medium: "organic", sessions: 1000, percentage: 45.5 },
    { source: "direct", medium: "none", sessions: 500, percentage: 22.7 }
  ]
  fetched_at: Timestamp
}
```

### API Reference
- GA4 Data API v1
- Method: `runReport`
- Scopes: `https://www.googleapis.com/auth/analytics.readonly`

### Technical Notes
- Use service account or OAuth depending on setup
- Batch requests where possible
- Store traffic sources as structured JSON for reporting
- Consider caching to reduce API calls

---

## F03: Equals 5 Browser Automation

### Description
Use Playwright browser automation to extract data from Equals 5 platform which has no API.

### User Stories

**US-F03-1: Configure Equals 5 Credentials**
> As an admin, I want to securely store Equals 5 credentials so that automation can log in.

**US-F03-2: Automated Data Extraction**
> As an analyst, I want Equals 5 data pulled automatically so that I don't need to manually export.

**US-F03-3: Handle Extraction Failures**
> As an admin, I want alerts when extraction fails so that I can fix the issue.

### Verified Platform Details (January 2026)

| Item | Value |
|------|-------|
| Login URL | `https://app.equals5.com/auth/sign-in` |
| Post-login URL | `https://app.equals5.com/app/campaigns` |
| Email selector | `input[type="email"]` |
| Password selector | `input[type="password"]` |
| Submit button | `button:has-text("Sign in")` |
| Export button | `button:has-text("Export")` (top toolbar) |
| Date Range button | `button:has-text("Date Range")` |

### Available Metrics
- Impressions, Identified Impressions
- Clicks, Identified Clicks
- Avg CTR, Reach
- Visits: Media, Clicks: Media
- Signals, Pacing

### Acceptance Criteria (Given/When/Then)

#### AC-F03-1: Successful Login
```gherkin
Given valid Equals 5 credentials are stored for a client
When the system initiates data extraction
Then the browser navigates to https://app.equals5.com/auth/sign-in
And enters credentials using verified selectors
And clicks Sign in button
And URL changes to contain "/app/" indicating success
```

#### AC-F03-2: Successful Data Export
```gherkin
Given the system has logged into Equals 5
When the system sets the date range and clicks Export
Then data is downloaded and parsed
And metrics are stored with extraction_status = "success"
```

#### AC-F03-3: Login Failure
```gherkin
Given invalid Equals 5 credentials
When login fails
Then a screenshot is captured for debugging
And extraction_status is set to "failed"
And an alert is sent to the admin
```

#### AC-F03-4: Retry on Failure
```gherkin
Given a transient failure occurs
When the system retries (max 3 attempts)
And all attempts fail
Then extraction is marked "failed" with error details
```

#### AC-F03-5: Screenshot on Error
```gherkin
Given any extraction step fails
Then a full-page screenshot is captured
And the path is stored in debug_screenshot_path
```

#### AC-F03-6: UI Change Detection
```gherkin
Given an expected element is not found
Then the operation fails with selector details
And admin is alerted to update selectors
```

### Automation Flow
```
1. Launch Playwright (headless)
2. Navigate to /auth/sign-in
3. Enter email/password
4. Click Sign in
5. Wait for /app/ URL
6. Click Date Range → set dates
7. Click Export
8. Download and parse file
9. Store data
10. Close browser
```

### Data Model
```
Equals5Data {
  id: UUID
  client_id: UUID
  date_range_start: Date
  date_range_end: Date
  raw_data: JSON
  impressions: Integer
  clicks: Integer
  avg_ctr: Decimal
  reach: Integer
  extraction_status: Enum (pending, success, failed)
  error_message: String (nullable)
  debug_screenshot_path: String (nullable)
  fetched_at: Timestamp
}
```

### Technical Notes
- Playwright verified working (January 2026 spike)
- Selectors in `src/lib/integrations/equals5/types.ts`
- Human-like delays (50-150ms between actions)
- Screenshots saved to `./tmp/equals5/`
- Credentials encrypted (see F11)

### Risks

| Risk | Mitigation |
|------|------------|
| UI changes | Screenshot on failure, modular selectors |
| Platform blocks automation | Human-like delays, user agent rotation |
| MFA added | TOTP support planned |

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
