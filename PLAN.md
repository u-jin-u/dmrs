# PLAN.md - Implementation Blueprint

**Document Version:** 1.0
**Last Updated:** January 2026
**Status:** Draft

---

## Overview

This document outlines the implementation plan for the Digital Marketing Reporting System. It combines product requirements, feature specifications, and technical approach into an actionable development roadmap.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │   Web Dashboard     │  │   Email Service     │  │   Google Drive      │  │
│  │   (Internal UI)     │  │   (Notifications)   │  │   (Report Delivery) │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                               │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │   Report Service    │  │   Workflow Service  │  │   Client Service    │  │
│  │   - Generation      │  │   - Approvals       │  │   - CRUD            │  │
│  │   - Templates       │  │   - Notifications   │  │   - Config          │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTEGRATION LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Meta Ads    │  │  Google      │  │  Equals 5    │  │  Google APIs     │ │
│  │  Connector   │  │  Analytics   │  │  BrowserMCP  │  │  Drive/Slides    │ │
│  │  (API)       │  │  Connector   │  │  Automation  │  │  Connector       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                DATA LAYER                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │   PostgreSQL        │  │   Secret Manager    │  │   File Storage      │  │
│  │   (Main Database)   │  │   (Credentials)     │  │   (Temp files)      │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack (Recommended)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js + React | Modern, fast, good DX |
| **Backend** | Node.js + Express or Next.js API routes | JavaScript ecosystem, good Google API libraries |
| **Database** | PostgreSQL | Reliable, JSON support for flexible data |
| **Browser Automation** | Playwright + BrowserMCP | Modern, reliable, good debugging |
| **Secret Management** | Google Secret Manager | Integrates with Google ecosystem |
| **Hosting** | Google Cloud Run | Serverless, scales with Google services |
| **Queue/Scheduler** | Google Cloud Scheduler + Pub/Sub | Managed, reliable |

**Alternative Stack Options:**
- Python (FastAPI) if team prefers
- AWS equivalent services
- Self-hosted with Docker

---

## Implementation Phases

### Phase 0: Project Setup
**Duration:** Sprint 0

| Task | Description | Owner |
|------|-------------|-------|
| P0-1 | Set up Git repository | DevOps |
| P0-2 | Initialize project structure | Backend |
| P0-3 | Set up CI/CD pipeline | DevOps |
| P0-4 | Provision cloud infrastructure | DevOps |
| P0-5 | Set up development environment | All |
| P0-6 | Create database schema | Backend |

**Deliverable:** Working development environment with CI/CD

---

### Phase 1: Technical Spike - Equals 5 Automation
**Duration:** 1 Sprint
**Priority:** CRITICAL - Validates highest-risk component

| Task | Description | Owner |
|------|-------------|-------|
| P1-1 | Analyze Equals 5 login flow | Backend |
| P1-2 | Implement BrowserMCP login automation | Backend |
| P1-3 | Navigate to data export section | Backend |
| P1-4 | Extract/download data | Backend |
| P1-5 | Parse XLSX data | Backend |
| P1-6 | Document findings and edge cases | Backend |

**Success Criteria:**
- [ ] Can log into Equals 5 automatically
- [ ] Can extract data for one test client
- [ ] Documented any MFA requirements
- [ ] Identified UI stability risks

**Deliverable:** Working Equals 5 connector proof-of-concept

---

### Phase 2: Core Integrations
**Duration:** 2 Sprints

#### Sprint 2a: Google Integrations

| Task | Description | Owner |
|------|-------------|-------|
| P2-1 | Implement Google OAuth flow | Backend |
| P2-2 | Build Google Drive connector (read screenshots) | Backend |
| P2-3 | Build Google Drive connector (write reports) | Backend |
| P2-4 | Build Google Slides API connector | Backend |
| P2-5 | Create template placeholder system | Backend |
| P2-6 | Test Slides generation with sample data | Backend |

#### Sprint 2b: Ad Platform Integrations

| Task | Description | Owner |
|------|-------------|-------|
| P2-7 | Implement Meta OAuth flow | Backend |
| P2-8 | Build Meta Ads data connector | Backend |
| P2-9 | Build Google Analytics 4 connector | Backend |
| P2-10 | Create data storage schema | Backend |
| P2-11 | Implement data fetch scheduling | Backend |

**Deliverable:** All data connectors working independently

---

### Phase 3: Report Generation Engine
**Duration:** 2 Sprints

#### Sprint 3a: Data Processing

| Task | Description | Owner |
|------|-------------|-------|
| P3-1 | Build data aggregation service | Backend |
| P3-2 | Implement cross-platform metrics calculation | Backend |
| P3-3 | Implement MoM comparison logic | Backend |
| P3-4 | Build chart/graph data preparation | Backend |

#### Sprint 3b: Report Assembly

| Task | Description | Owner |
|------|-------------|-------|
| P3-5 | Build Google Slides report generator | Backend |
| P3-6 | Implement screenshot insertion | Backend |
| P3-7 | Build XLSX report generator | Backend |
| P3-8 | Implement client branding application | Backend |
| P3-9 | End-to-end report generation test | QA |

**Deliverable:** Complete report generation from data to Slides/XLSX

---

### Phase 4: Dashboard & Workflow
**Duration:** 2 Sprints

#### Sprint 4a: Core Dashboard

| Task | Description | Owner |
|------|-------------|-------|
| P4-1 | Set up Next.js frontend | Frontend |
| P4-2 | Build authentication (Google SSO) | Full Stack |
| P4-3 | Build client management screens | Frontend |
| P4-4 | Build report list/dashboard | Frontend |
| P4-5 | Build report detail view | Frontend |

#### Sprint 4b: Workflow & Admin

| Task | Description | Owner |
|------|-------------|-------|
| P4-6 | Implement approval workflow UI | Frontend |
| P4-7 | Build notification service (email) | Backend |
| P4-8 | Build credential management UI | Frontend |
| P4-9 | Build template management UI | Frontend |
| P4-10 | Implement executive summary editor | Frontend |

**Deliverable:** Functional internal dashboard with workflow

---

### Phase 5: Integration & Testing
**Duration:** 1 Sprint

| Task | Description | Owner |
|------|-------------|-------|
| P5-1 | End-to-end integration testing | QA |
| P5-2 | Fix integration bugs | All |
| P5-3 | Performance testing | QA |
| P5-4 | Security review | Security |
| P5-5 | User acceptance testing prep | PM |

**Deliverable:** Stable, tested system ready for pilot

---

### Phase 6: Pilot
**Duration:** 1-2 Sprints

| Task | Description | Owner |
|------|-------------|-------|
| P6-1 | Select 3 pilot clients | PM |
| P6-2 | Configure pilot clients | Team |
| P6-3 | Generate first reports | Analysts |
| P6-4 | Gather feedback | PM |
| P6-5 | Fix issues and iterate | All |
| P6-6 | Document learnings | PM |

**Deliverable:** Validated system with real client reports

---

### Phase 7: Rollout
**Duration:** 2 Sprints

| Task | Description | Owner |
|------|-------------|-------|
| P7-1 | Create user documentation | PM |
| P7-2 | Train account managers | PM |
| P7-3 | Onboard remaining clients (batches of 5-10) | Team |
| P7-4 | Monitor and support | All |
| P7-5 | Optimize based on usage | Backend |

**Deliverable:** All 30 clients onboarded and operational

---

## Database Schema

```sql
-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',

  -- Platform configs
  meta_ads_account_ids TEXT[],
  ga4_property_ids TEXT[],
  equals5_enabled BOOLEAN DEFAULT false,
  equals5_credential_id UUID REFERENCES credentials(id),

  -- Google Drive
  screenshot_folder_id VARCHAR(255),
  delivery_folder_id VARCHAR(255),

  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),

  -- Template
  slides_template_id VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Credentials (encrypted)
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  platform VARCHAR(50) NOT NULL,
  encrypted_data TEXT NOT NULL, -- JSON encrypted
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketing Data (Meta Ads)
CREATE TABLE meta_ads_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  account_id VARCHAR(100),
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  spend DECIMAL(12,2),
  impressions BIGINT,
  reach BIGINT,
  clicks BIGINT,
  ctr DECIMAL(5,4),
  campaigns JSONB,
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- Marketing Data (Google Analytics)
CREATE TABLE ga_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  property_id VARCHAR(100),
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  sessions BIGINT,
  users BIGINT,
  new_users BIGINT,
  conversions BIGINT,
  traffic_sources JSONB,
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- Marketing Data (Equals 5)
CREATE TABLE equals5_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  raw_data JSONB,
  extraction_status VARCHAR(20),
  error_message TEXT,
  debug_screenshot_path TEXT,
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  period VARCHAR(7) NOT NULL, -- YYYY-MM
  status VARCHAR(20) DEFAULT 'draft',

  slides_url TEXT,
  xlsx_url TEXT,
  executive_summary TEXT,

  submitted_by UUID,
  submitted_at TIMESTAMP,
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  delivered_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Report Status History
CREATE TABLE report_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id),
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  changed_by UUID,
  comment TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slides_document_id VARCHAR(255),
  placeholders JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL, -- analyst, account_manager, manager, admin
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Clients
```
GET    /api/clients           - List all clients
POST   /api/clients           - Create client
GET    /api/clients/:id       - Get client details
PUT    /api/clients/:id       - Update client
DELETE /api/clients/:id       - Delete client
```

### Data
```
POST   /api/data/fetch/:clientId          - Trigger data fetch for client
GET    /api/data/meta/:clientId           - Get Meta Ads data
GET    /api/data/ga/:clientId             - Get GA data
GET    /api/data/equals5/:clientId        - Get Equals 5 data
GET    /api/data/status/:clientId         - Get data fetch status
```

### Reports
```
GET    /api/reports                       - List all reports
POST   /api/reports/generate/:clientId    - Generate report
GET    /api/reports/:id                   - Get report details
PUT    /api/reports/:id                   - Update report (summary)
POST   /api/reports/:id/submit            - Submit for review
POST   /api/reports/:id/approve           - Approve report
POST   /api/reports/:id/reject            - Reject report
POST   /api/reports/:id/deliver           - Deliver to client
```

### Templates
```
GET    /api/templates                     - List templates
POST   /api/templates                     - Create template
GET    /api/templates/:id                 - Get template
PUT    /api/templates/:id                 - Update template
DELETE /api/templates/:id                 - Delete template
```

### Credentials
```
GET    /api/credentials/:clientId         - List credentials (masked)
POST   /api/credentials                   - Add credential
PUT    /api/credentials/:id               - Update credential
DELETE /api/credentials/:id               - Delete credential
```

---

## Folder Structure

```
src/
├── app/                      # Next.js app router
│   ├── (auth)/              # Auth routes
│   ├── (dashboard)/         # Dashboard routes
│   │   ├── clients/
│   │   ├── reports/
│   │   ├── templates/
│   │   └── settings/
│   └── api/                 # API routes
│       ├── clients/
│       ├── data/
│       ├── reports/
│       └── templates/
│
├── components/              # React components
│   ├── ui/                  # Base UI components
│   ├── clients/             # Client-related components
│   ├── reports/             # Report-related components
│   └── layout/              # Layout components
│
├── lib/                     # Core libraries
│   ├── db/                  # Database client & queries
│   ├── integrations/        # External integrations
│   │   ├── meta/           # Meta Ads connector
│   │   ├── google/         # Google APIs connector
│   │   ├── equals5/        # BrowserMCP automation
│   │   └── email/          # Email service
│   ├── reports/            # Report generation
│   │   ├── slides.ts       # Slides generator
│   │   ├── xlsx.ts         # Excel generator
│   │   └── charts.ts       # Chart generation
│   └── utils/              # Utility functions
│
├── types/                   # TypeScript types
│
└── config/                  # Configuration
```

---

## Risk Mitigation

| Risk | Mitigation Strategy | Contingency |
|------|---------------------|-------------|
| Equals 5 automation fails | Phase 1 spike validates early | Fall back to manual XLSX upload |
| Equals 5 UI changes | Monitor automation, alerting | Quick-fix process, manual backup |
| API rate limits | Implement caching, scheduling | Queue and retry |
| Report generation slow | Async processing, background jobs | Acceptable - no performance requirements |
| Scope creep | Strict PRD adherence | Defer to v2 |

---

## Definition of Done

A feature is considered done when:
- [ ] Code complete and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Tested by QA
- [ ] Accepted by Product Owner

---

## Open Decisions

| Decision | Options | Status |
|----------|---------|--------|
| Cloud provider | GCP vs AWS vs Azure | Recommend GCP (Google ecosystem) |
| Frontend framework | Next.js vs Remix vs SPA | Recommend Next.js |
| Deployment model | Serverless vs Containers | TBD |
| Email provider | SendGrid vs AWS SES vs Gmail API | TBD |

---

## Next Steps

1. **Immediate:** Review and approve this plan
2. **Week 1:** Phase 0 - Project setup
3. **Week 2:** Phase 1 - Equals 5 technical spike
4. **Ongoing:** Iterate based on findings

---

*This plan should be reviewed by the development team and adjusted based on team capacity and technical findings.*
