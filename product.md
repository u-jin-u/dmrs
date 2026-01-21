# Product Requirements Document (PRD)
# Digital Marketing Reporting System

**Version:** 1.0
**Date:** January 2026
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Problem Statement
The current reporting process involves manual copy-pasting of digital marketing data from multiple platforms (Meta Ads, Google Analytics, Equals 5), resulting in:
- Excessive time spent on report creation
- Human errors in data entry and calculations
- Inconsistent report quality across clients

### 1.2 Solution Overview
Build an automated reporting system that aggregates marketing data from multiple sources, generates client-ready presentation reports with screenshots, and streamlines the review/approval workflow before delivery.

### 1.3 Target Users
- **Account Managers**: Review reports, deliver to clients
- **Analysts**: Create and review reports, add executive summaries
- **Managers**: Approve reports before client delivery

---

## 2. Business Context

| Attribute | Value |
|-----------|-------|
| Target Clients | SME and Enterprise (Pharma, Media Agencies) |
| Current Client Count | 30 |
| Projected Scale | 50 clients |
| Report Frequency | Monthly |
| Timeline | As soon as possible |
| Budget | To be defined |

### 2.1 Success Metrics
- **Time saved per report**: Target 70%+ reduction in report creation time
- **Error reduction**: Target zero data entry errors through automation

---

## 3. Data Sources

### 3.1 Integration Overview

| Platform | Integration Type | Method |
|----------|-----------------|--------|
| Meta Ads | API | Meta Marketing API |
| Google Analytics 4 | API | GA4 API |
| Equals 5 | Browser Automation | BrowserMCP |
| Screenshots | File Storage | Google Drive folder |

**All data collection is fully automated.** No manual uploads required.

### 3.2 Meta Ads (API Integration)
- **Method**: Meta Marketing API
- **Authentication**: OAuth 2.0
- **Data Points**: Spend, Impressions, Reach, Clicks, CTR

### 3.3 Google Analytics 4 (API Integration)
- **Method**: GA4 Data API
- **Authentication**: OAuth 2.0
- **Data Points**: Sessions, Users, Conversions, Traffic sources

### 3.4 Equals 5 (Browser Automation)
- **Method**: BrowserMCP (browser automation)
- **Rationale**: Equals 5 does not provide an API
- **Process**:
  1. System automatically logs into Equals 5 platform
  2. Navigates to reporting/export section
  3. Extracts required data (or downloads XLSX and parses)
  4. Stores data in system database
- **Data Points**: All available metrics from platform
- **Considerations**:
  - Requires storing Equals 5 credentials securely
  - Must handle session management and re-authentication
  - Needs error handling for UI changes on Equals 5 platform
  - Should run during off-peak hours to minimize load

### 3.5 Screenshots (Google Drive)
- **Source**: Designated Google Drive folder per client
- **Purpose**: Visual assets to be included in Google Slides reports
- **Process**:
  1. System reads screenshots from client's designated screenshot folder
  2. Automatically inserts screenshots into appropriate slides in report
- **Supported Formats**: PNG, JPG, GIF
- **Folder Structure**: Each client has a dedicated screenshots folder on Google Drive

### 3.6 Key Metrics Tracked
- Spend / Budget
- Impressions / Reach
- Clicks / CTR
- All metrics from Equals 5 platform

### 3.7 Client Platform Variation
Not all clients use all platforms. The system must support flexible platform combinations per client:
- Client A: Meta Ads + Google Analytics + Equals 5
- Client B: Meta Ads + Google Analytics only
- Client C: Google Analytics + Equals 5 only
- etc.

---

## 4. Report Specifications

### 4.1 Output Formats
- Google Slides (primary)
- XLSX (alternative)

### 4.2 Report Sections

| Section | Description | Data Source |
|---------|-------------|-------------|
| Executive Summary | Key highlights and insights | Manual (written by team) |
| Spend Overview | Budget allocation and spend tracking | Meta Ads, Equals 5 |
| Performance Metrics | Impressions, Reach, Clicks, CTR | All platforms (combined) |
| Platform Breakdown | Performance per platform | All platforms (individual) |
| Campaign-level Details | Granular campaign performance | All platforms |
| Screenshots | Visual assets from campaigns | Google Drive folder |

### 4.3 Screenshot Integration
- Screenshots stored in designated Google Drive folder are automatically inserted into reports
- System must match screenshots to appropriate report sections/slides
- Support for multiple screenshots per report
- Configurable placement within Google Slides template

### 4.4 Comparison Requirements
- **Period comparison**: Current month vs. Previous month
- Display absolute values and percentage change

### 4.5 Visualizations
- Charts (bar, line, pie as appropriate)
- Graphs (trend lines, comparisons)
- Data tables
- Screenshots from Google Drive

### 4.6 Branding & Templates
- **Client-specific templates**: Each client has unique branding
- **Branding elements**: Client logo, agency logo, custom color schemes
- **Template management**: System must support creating and managing multiple templates

---

## 5. User Workflow

### 5.1 Report Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. DATA COLLECTION (Fully Automated)                           │
│     ├── Meta Ads API → pulls data automatically                 │
│     ├── Google Analytics API → pulls data automatically         │
│     ├── Equals 5 → BrowserMCP extracts data automatically       │
│     └── Screenshots → fetched from Google Drive folder          │
│                                                                 │
│  2. REPORT GENERATION (Automated)                               │
│     ├── System generates report draft with all data             │
│     └── Screenshots inserted into appropriate slides            │
│                                                                 │
│  3. REVIEW & EDIT (Analyst)                                     │
│     ├── Review auto-generated content                           │
│     ├── Write executive summary                                 │
│     └── Make any necessary adjustments                          │
│                                                                 │
│  4. NOTIFICATION                                                │
│     └── System notifies Manager that report is ready            │
│                                                                 │
│  5. APPROVAL (Manager)                                          │
│     └── Manager reviews and approves report                     │
│                                                                 │
│  6. DELIVERY                                                    │
│     └── Report saved to client's Google Drive folder            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| Analyst | Generate reports, edit reports, submit for approval |
| Account Manager | View reports, submit for approval |
| Manager | All above + approve reports, manage templates, manage clients |
| Admin | All above + manage Equals 5 credentials, system configuration |

---

## 6. Technical Requirements

### 6.1 Integrations

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| Meta Ads | API | Automated data pull |
| Google Analytics 4 | API | Automated data pull |
| Equals 5 | BrowserMCP | Automated data extraction via browser automation |
| Google Drive | API | Screenshot retrieval + Report storage and delivery |
| Google Slides | API | Report generation with screenshots |

### 6.2 BrowserMCP Requirements for Equals 5

| Requirement | Description |
|-------------|-------------|
| Headless Browser | Run browser automation without GUI |
| Credential Storage | Secure vault for Equals 5 login credentials |
| Session Management | Handle login sessions, timeouts, re-authentication |
| Error Recovery | Retry logic for failed extractions |
| Scheduling | Run data extraction on configurable schedule |
| Logging | Detailed logs for debugging automation failures |
| UI Change Detection | Alert when Equals 5 UI changes break automation |

### 6.3 Screenshot Handling

| Requirement | Description |
|-------------|-------------|
| Folder Monitoring | Read from designated Google Drive folder per client |
| Image Processing | Support PNG, JPG, GIF formats |
| Slide Insertion | Insert images into Google Slides at designated placeholders |
| Naming Convention | Support naming convention to map screenshots to slides (optional) |

### 6.4 Notifications
- **Trigger**: Report ready for review
- **Recipient**: Assigned Manager
- **Channel**: Email (minimum), Slack (optional enhancement)

### 6.5 Infrastructure
- Cloud provider: No preference (recommend Google Cloud for Google ecosystem alignment)
- Must support 50 clients with monthly report generation
- Data storage for historical reports and raw data
- Dedicated environment for browser automation (BrowserMCP)

### 6.6 Security
- Secure credential storage for Equals 5 accounts (encrypted at rest)
- Standard security best practices apply
- User authentication required
- Audit logging for credential access

---

## 7. Functional Requirements

### 7.1 Client Management
| ID | Requirement | Priority |
|----|-------------|----------|
| CM-01 | Create/edit/delete client profiles | Must Have |
| CM-02 | Assign platforms per client (Meta, GA, Equals 5) | Must Have |
| CM-03 | Upload and manage client branding assets | Must Have |
| CM-04 | Create and assign report templates per client | Must Have |
| CM-05 | Configure client's Google Drive folder for report delivery | Must Have |
| CM-06 | Configure client's Google Drive folder for screenshots | Must Have |
| CM-07 | Store Equals 5 credentials per client (encrypted) | Must Have |

### 7.2 Data Management
| ID | Requirement | Priority |
|----|-------------|----------|
| DM-01 | Connect Meta Ads accounts via OAuth | Must Have |
| DM-02 | Connect Google Analytics properties via OAuth | Must Have |
| DM-03 | Configure Equals 5 automation per client | Must Have |
| DM-04 | Schedule automated data pulls for all platforms | Must Have |
| DM-05 | Store historical data for period comparisons | Must Have |
| DM-06 | Manual trigger for data refresh | Should Have |
| DM-07 | Data extraction status dashboard | Must Have |
| DM-08 | Alert on Equals 5 extraction failures | Must Have |

### 7.3 Screenshot Management
| ID | Requirement | Priority |
|----|-------------|----------|
| SM-01 | Read screenshots from client's Google Drive folder | Must Have |
| SM-02 | Support PNG, JPG, GIF image formats | Must Have |
| SM-03 | Insert screenshots into Google Slides template | Must Have |
| SM-04 | Map screenshots to specific slides (via naming or config) | Should Have |
| SM-05 | Handle missing screenshots gracefully | Must Have |

### 7.4 BrowserMCP / Equals 5 Automation
| ID | Requirement | Priority |
|----|-------------|----------|
| BM-01 | Automated login to Equals 5 | Must Have |
| BM-02 | Navigate to data export/reporting section | Must Have |
| BM-03 | Extract or download required metrics | Must Have |
| BM-04 | Parse extracted data into standard format | Must Have |
| BM-05 | Handle multi-factor authentication if required | Should Have |
| BM-06 | Retry failed extractions (max 3 attempts) | Must Have |
| BM-07 | Screenshot capture on failure for debugging | Should Have |
| BM-08 | Configurable extraction schedule per client | Must Have |

### 7.5 Report Generation
| ID | Requirement | Priority |
|----|-------------|----------|
| RG-01 | Generate Google Slides report from template | Must Have |
| RG-02 | Generate XLSX report | Must Have |
| RG-03 | Populate combined cross-platform metrics | Must Have |
| RG-04 | Include platform-by-platform breakdown | Must Have |
| RG-05 | Calculate month-over-month comparisons | Must Have |
| RG-06 | Generate charts and visualizations | Must Have |
| RG-07 | Apply client branding to reports | Must Have |
| RG-08 | Include campaign-level detail tables | Must Have |
| RG-09 | Insert screenshots from Google Drive into slides | Must Have |

### 7.6 Workflow & Collaboration
| ID | Requirement | Priority |
|----|-------------|----------|
| WF-01 | Report status tracking (Draft, In Review, Approved, Delivered) | Must Have |
| WF-02 | Editable executive summary field | Must Have |
| WF-03 | Submit report for manager approval | Must Have |
| WF-04 | Manager approval/rejection with comments | Must Have |
| WF-05 | Email notification to manager when report ready for review | Must Have |
| WF-06 | Export approved report to client Google Drive folder | Must Have |

### 7.7 Template Management
| ID | Requirement | Priority |
|----|-------------|----------|
| TM-01 | Create Google Slides templates with placeholders | Must Have |
| TM-02 | Define screenshot placeholder positions in template | Must Have |
| TM-03 | Define which sections appear in each template | Should Have |
| TM-04 | Preview template before applying | Should Have |

---

## 8. Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| Scalability | Support minimum 50 clients |
| Browser Support | Chrome, Firefox, Safari (latest versions) |
| Mobile | Responsive design for review/approval (not creation) |

**Note:** No specific performance or uptime requirements.

---

## 9. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Equals 5 UI changes break automation | High | Medium | UI change detection, screenshot logging, alerting |
| Equals 5 blocks automation | High | Low | Rotate IPs, add delays, mimic human behavior |
| Credential security breach | High | Low | Encrypted storage, access audit logs, rotation policy |
| BrowserMCP reliability issues | Medium | Medium | Retry logic, fallback to manual upload option |
| Screenshots missing from folder | Low | Medium | Graceful handling, placeholder or skip |

---

## 10. Out of Scope (v1.0)

- Real-time dashboards / live data views
- Client self-service portal
- Additional platforms beyond Meta Ads, GA4, Equals 5
- Automated executive summary generation (AI-written)
- Multi-language report support
- White-label solution for resellers

---

## 11. Future Considerations (v2.0+)

- Additional platform integrations (Google Ads, LinkedIn, TikTok)
- AI-powered insights and recommendations
- Client portal for self-service report access
- Automated anomaly detection and alerts
- Custom report scheduling (weekly, quarterly)
- API for Equals 5 if/when available (replace browser automation)
- Automated screenshot capture from platforms

---

## 12. Open Questions

1. What is the exact URL and navigation path for Equals 5 data export?
2. Does Equals 5 use multi-factor authentication?
3. Are there rate limits or anti-automation measures on Equals 5?
4. What is the folder structure for screenshots? (e.g., `/ClientName/Screenshots/`)
5. How should screenshots be named to map to specific slides?
6. Are there existing Google Slides templates that should be replicated?
7. What email system should notifications use?
8. How long should historical data be retained?
9. Should there be a bulk report generation feature (all clients at once)?

---

## 13. Appendix

### A. Glossary
- **CTR**: Click-through rate (Clicks / Impressions)
- **GA4**: Google Analytics 4
- **Meta Ads**: Facebook/Instagram advertising platform
- **Equals 5**: Third-party marketing platform (no API available)
- **BrowserMCP**: Browser automation tool using Model Context Protocol for web scraping/interaction

### B. Assumptions
1. All team members have Google Workspace accounts
2. Meta and Google API access can be obtained for all client accounts
3. Equals 5 allows automated browser access (no CAPTCHA or blocking)
4. Equals 5 credentials can be obtained for all client accounts
5. Client Google Drive folders already exist or can be created
6. Screenshots will be uploaded to designated folders before report generation

---

*Document prepared based on requirements gathering session*
