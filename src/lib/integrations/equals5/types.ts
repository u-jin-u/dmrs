/**
 * Equals 5 Integration Types
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
  // Core metrics (adjust based on actual export)
  spend?: number;
  impressions?: number;
  clicks?: number;
  reach?: number;

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

// Selectors for Equals 5 pages
// These will need to be updated based on actual page structure
export const SELECTORS = {
  // Login page - TO BE DETERMINED
  login: {
    emailInput: 'input[type="email"], input[name="email"], #email',
    passwordInput: 'input[type="password"], input[name="password"], #password',
    submitButton: 'button[type="submit"], input[type="submit"]',
    errorMessage: '.error, .alert-error, [role="alert"]',
    mfaInput: 'input[name="mfa"], input[name="code"], #mfa-code',
  },

  // Dashboard/Navigation - TO BE DETERMINED
  nav: {
    dashboard: '[data-nav="dashboard"], .dashboard-link',
    reports: '[data-nav="reports"], .reports-link, a[href*="report"]',
    export: '[data-nav="export"], .export-link, a[href*="export"]',
  },

  // Export page - TO BE DETERMINED
  export: {
    dateStart: 'input[name="startDate"], #start-date',
    dateEnd: 'input[name="endDate"], #end-date',
    exportButton: 'button:has-text("Export"), .export-btn',
    downloadLink: 'a[download], .download-link',
  },

  // Common
  common: {
    loading: '.loading, .spinner, [aria-busy="true"]',
    modal: '.modal, [role="dialog"]',
  },
} as const;
