# EPIC: Automated Digital Marketing Reporting System

**Epic ID:** DMRS-001
**Owner:** Product Owner
**Status:** Draft
**Created:** January 2026

---

## Epic Statement

> **As a** digital marketing agency
> **We want** an automated system that collects data from Meta Ads, Google Analytics, and Equals 5, then generates branded client reports
> **So that** we can eliminate manual copy-paste work, reduce errors, and deliver consistent monthly reports to 30-50 clients efficiently

---

## Business Value

| Metric | Current State | Target State |
|--------|---------------|--------------|
| Time per report | 2-4 hours (manual) | 15-30 minutes (review only) |
| Error rate | Frequent mistakes | Zero data errors |
| Clients supported | 30 | 50+ |
| Team burnout | High (repetitive work) | Low (value-add work) |

---

## Epic Scope

### In Scope
- Automated data collection from Meta Ads (API)
- Automated data collection from Google Analytics 4 (API)
- Automated data collection from Equals 5 (BrowserMCP)
- Screenshot integration from Google Drive
- Google Slides report generation with client branding
- XLSX report generation
- Month-over-month comparison
- Approval workflow (Analyst → Manager)
- Manager notification system
- Report delivery to Google Drive

### Out of Scope (v1)
- Real-time dashboards
- Client self-service portal
- AI-generated insights/summaries
- Platforms beyond Meta, GA4, Equals 5

---

## User Stories Summary

### Data Collection
- [ ] US-001: Automated Meta Ads data pull
- [ ] US-002: Automated Google Analytics data pull
- [ ] US-003: Automated Equals 5 data extraction via BrowserMCP
- [ ] US-004: Screenshot retrieval from Google Drive

### Report Generation
- [ ] US-005: Generate Google Slides report from template
- [ ] US-006: Generate XLSX report
- [ ] US-007: Insert screenshots into slides
- [ ] US-008: Apply client branding
- [ ] US-009: Calculate MoM comparisons

### Workflow
- [ ] US-010: Submit report for approval
- [ ] US-011: Manager approval/rejection
- [ ] US-012: Email notification on report ready
- [ ] US-013: Deliver report to Google Drive

### Administration
- [ ] US-014: Client management (CRUD)
- [ ] US-015: Template management
- [ ] US-016: Credential management for Equals 5

---

## Key Stakeholders

| Role | Responsibility |
|------|----------------|
| Product Owner | Requirements, prioritization, acceptance |
| Account Managers | End users, provide feedback, upload screenshots |
| Analysts | End users, review reports, write summaries |
| Managers | Approve reports, oversee quality |
| Development Team | Build and maintain the system |

---

## Success Criteria

1. **Functional**: All 30 clients can have reports generated automatically
2. **Quality**: Zero data discrepancies between source and report
3. **Adoption**: Team actively uses system for all monthly reports
4. **Scalability**: System handles 50 clients without issues

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Equals 5 blocks automation | High | Test early, have manual fallback |
| Equals 5 UI changes | Medium | Monitoring, alerting, quick fixes |
| Google API rate limits | Low | Implement throttling, caching |
| Adoption resistance | Medium | Involve users early, training |

---

## Dependencies

- Access to Meta Ads accounts (OAuth)
- Access to Google Analytics properties (OAuth)
- Equals 5 credentials for all clients
- Google Workspace access
- Existing report templates (for replication)

---

## Timeline

| Phase | Description |
|-------|-------------|
| Phase 1 | Technical spike - validate Equals 5 automation |
| Phase 2 | Core integrations (Meta, GA4, Google Drive) |
| Phase 3 | Equals 5 automation + Report generation |
| Phase 4 | Workflow + UI |
| Phase 5 | Pilot (3 clients) |
| Phase 6 | Rollout (remaining clients) |

---

## Related Documents

- [product.md](./product.md) - Full PRD
- [FEATURES.md](./FEATURES.md) - Detailed feature specs
- [PLAN.md](./PLAN.md) - Implementation plan
- [CLAUDE.md](./CLAUDE.md) - AI assistant context
