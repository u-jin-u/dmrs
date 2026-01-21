# Equals 5 Browser Automation

This folder contains the BrowserMCP automation for Equals 5 platform.

## CRITICAL: High-Risk Component

Equals 5 has no API. We use browser automation which is inherently fragile.

## Quick Start

### Step 1: Explore the UI

Run the exploration script to discover the login page structure:

```bash
EQUALS5_USERNAME=your@email.com EQUALS5_PASSWORD=yourpassword npx tsx src/lib/integrations/equals5/explore.ts
```

This will:
- Open a browser window (headed mode)
- Navigate to Equals 5
- Take screenshots at each step
- Log all form fields, buttons, and links found
- Keep the browser open for manual inspection

Screenshots are saved to `./tmp/equals5-exploration/`

### Step 2: Update Selectors

Based on the exploration, update the selectors in `types.ts`:

```typescript
export const SELECTORS = {
  login: {
    emailInput: 'YOUR_SELECTOR_HERE',
    passwordInput: 'YOUR_SELECTOR_HERE',
    submitButton: 'YOUR_SELECTOR_HERE',
    // ...
  },
  // ...
};
```

### Step 3: Test Login

```typescript
import { testLogin } from './index';

const result = await testLogin({
  username: 'your@email.com',
  password: 'yourpassword',
});

console.log(result.success ? 'Login successful!' : `Failed: ${result.error}`);
```

## Files

| File | Purpose |
|------|---------|
| `types.ts` | Type definitions and UI selectors |
| `errors.ts` | Custom error classes |
| `browser.ts` | Playwright browser setup |
| `login.ts` | Login automation |
| `explore.ts` | UI exploration script |
| `index.ts` | Main public API |

## Automation Flow

```
1. Launch headless browser (Playwright)
2. Navigate to https://app.equals5.com
3. Wait for SPA to load
4. Enter credentials
5. Handle MFA if required
6. Navigate to Reports/Export
7. Set date range
8. Download data (XLSX)
9. Parse and return data
10. Close browser
```

## Error Handling

All operations capture screenshots on failure:

```typescript
try {
  const result = await fetchEquals5Data({
    credentials: { username, password },
    dateStart: new Date('2026-01-01'),
    dateEnd: new Date('2026-01-31'),
  });
} catch (error) {
  if (error instanceof Equals5Error) {
    console.log('Screenshot at:', error.screenshotPath);
  }
}
```

## Debugging

### Run in headed mode

```bash
# The explore script always runs headed
npx tsx src/lib/integrations/equals5/explore.ts
```

### Check screenshots

Screenshots are saved to `./tmp/equals5/` with timestamps:
- `01-login-page-{timestamp}.png`
- `02-credentials-entered-{timestamp}.png`
- `error-login-{timestamp}.png` (on failure)

## Maintenance

When Equals 5 UI changes:

1. Run `explore.ts` to see the new UI
2. Update selectors in `types.ts`
3. Test login flow
4. Test full extraction flow
5. Update this README with any changes

## Security Notes

- Never commit credentials
- Store credentials in `.env` file (git-ignored)
- Use encrypted storage in production (see `Credential` model)
