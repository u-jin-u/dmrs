# Equals 5 Browser Automation

This folder contains the BrowserMCP automation for Equals 5 platform.

## CRITICAL: High-Risk Component

Equals 5 has no API. We use browser automation which is inherently fragile.

## Files to Create

- `browser.ts` - Playwright browser setup
- `login.ts` - Login automation
- `navigate.ts` - Navigation helpers
- `extract.ts` - Data extraction logic
- `parse.ts` - XLSX parsing
- `types.ts` - Equals 5 data types

## Automation Flow

```
1. Launch headless browser (Playwright)
2. Navigate to Equals 5 login page
3. Enter credentials (from encrypted vault)
4. Handle MFA if required
5. Navigate to Reports > Export
6. Select date range
7. Download XLSX export
8. Parse XLSX data
9. Store in database
10. Close browser
```

## Error Handling

- Screenshot on failure (for debugging)
- Retry up to 3 times
- Alert on persistent failure
- Graceful degradation (allow manual upload)

## Testing

```bash
# Run with visible browser for debugging
npm run equals5:test -- --headed

# Test specific client
npm run equals5:test -- --client=ClientName
```

## Maintenance

When Equals 5 UI changes:
1. Run with `--headed` to see what changed
2. Update selectors in `navigate.ts`
3. Test all clients
4. Document changes

## Selectors (Update as needed)

```typescript
// These will need updating when UI changes
const SELECTORS = {
  loginForm: '#login-form',
  usernameField: '#username',
  passwordField: '#password',
  submitButton: 'button[type="submit"]',
  reportsMenu: '[data-nav="reports"]',
  exportButton: '.export-btn',
  // ... etc
}
```
