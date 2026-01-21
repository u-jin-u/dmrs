/**
 * Equals 5 Integration Types
 *
 * Last verified: January 2026
 * Login URL: https://app.equals5.com/auth/sign-in
 * Post-login URL: https://app.equals5.com/app/campaigns
 */

export interface Equals5Credentials {
  username: string;
  password: string;
  mfaSecret?: string; // TOTP secret for MFA if required
}

export interface Equals5Config {
  baseUrl: string;
  headless: boolean;
  slowMo: number;
  timeout: number;
  downloadPath: string;
}

export interface Equals5Data {
  // Core metrics from Equals 5
  impressions?: number;
  identifiedImpressions?: number;
  clicks?: number;
  identifiedClicks?: number;
  avgCtr?: number;
  reach?: number;
  visitsMedia?: number;
  clicksMedia?: number;
  signals?: number;

  // Spend if available
  spend?: number;

  // Raw data from export
  rawData: Record<string, unknown>;

  // Metadata
  dateStart: Date;
  dateEnd: Date;
  extractedAt: Date;
}

export interface ExtractionResult {
  success: boolean;
  data?: Equals5Data;
  error?: string;
  screenshotPath?: string;
}

export interface BrowserOptions {
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
}

/**
 * Selectors for Equals 5 pages
 *
 * VERIFIED January 2026
 */
export const SELECTORS = {
  // Login page - VERIFIED
  login: {
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    submitButton: 'button:has-text("Sign in")',
    errorMessage: '.error, .alert, [role="alert"]',
    mfaInput: 'input[name="mfa"], input[name="code"], input[type="tel"]',
  },

  // Dashboard/Navigation - VERIFIED
  nav: {
    // Left sidebar icons (from top to bottom based on screenshot)
    dashboard: 'nav a[href*="dashboard"], .sidebar a:first-child',
    campaigns: 'a[href*="campaigns"]',
    segments: 'a[href*="segments"]',
    creatives: 'a[href*="creatives"]',
    // User menu at bottom
    userMenu: '.user-menu, [data-testid="user-menu"]',
  },

  // Top toolbar - VERIFIED (using more specific selectors)
  toolbar: {
    newCampaign: 'button:has-text("New Campaign")',
    duplicate: 'button:has-text("Duplicate")',
    // Use text content match with the calendar icon parent
    dateRange: 'text="Date Range"',
    filters: 'text="Filters"',
    // Export button in the top toolbar (not in campaign detail)
    export: 'text="Export" >> nth=0',
  },

  // Date range picker (to be verified when clicking Date Range)
  dateRange: {
    startDate: 'input[name="startDate"], input[placeholder*="Start"]',
    endDate: 'input[name="endDate"], input[placeholder*="End"]',
    applyButton: 'button:has-text("Apply"), button:has-text("OK")',
    cancelButton: 'button:has-text("Cancel")',
  },

  // Export dialog/options (to be verified when clicking Export)
  export: {
    exportButton: 'button:has-text("Export")',
    downloadButton: 'button:has-text("Download"), a[download]',
    csvOption: 'button:has-text("CSV"), [data-format="csv"]',
    excelOption: 'button:has-text("Excel"), [data-format="xlsx"]',
  },

  // Table columns (for reference)
  table: {
    header: 'thead tr th',
    rows: 'tbody tr',
    nameColumn: 'td:nth-child(1)',
    statusColumn: 'td:nth-child(2)',
    impressionsColumn: 'td:has-text("Impressions")',
    clicksColumn: 'td:has-text("Clicks")',
  },

  // Common
  common: {
    loading: '.loading, .spinner, [aria-busy="true"]',
    modal: '.modal, [role="dialog"]',
    closeModal: 'button[aria-label="Close"], .modal-close',
    emptyState: ':has-text("No Campaigns have been created")',
  },
} as const;

// URLs
export const EQUALS5_URLS = {
  base: 'https://app.equals5.com',
  login: 'https://app.equals5.com/auth/sign-in',
  campaigns: 'https://app.equals5.com/app/campaigns',
} as const;
