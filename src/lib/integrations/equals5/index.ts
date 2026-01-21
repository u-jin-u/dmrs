/**
 * Equals 5 Integration
 *
 * Browser automation for extracting data from Equals 5 platform.
 * Since Equals 5 has no API, we use Playwright for web scraping.
 */

// Types
export * from "./types";

// Errors
export * from "./errors";

// Service (primary interface)
export {
  Equals5Service,
  getEquals5Service,
  createEquals5Service,
  type Equals5ServiceConfig,
  type FetchResult,
} from "./service";

// Export functionality
export {
  exportData,
  setDateRange,
  triggerExport,
  navigateToCampaigns,
} from "./export";

// Parser
export {
  parseExportFile,
  parseExportBuffer,
  validateParsedData,
} from "./parser";

// Browser utilities
export {
  createBrowser,
  createContext,
  createPage,
  takeScreenshot,
  waitForPageReady,
  typeHumanLike,
  humanDelay,
} from "./browser";

// Login utilities
export {
  login,
  isLoggedIn,
  logout,
  navigateToLogin,
} from "./login";

/**
 * Convenience function: Fetch Equals 5 data using the service
 */
export async function fetchEquals5Data(options: {
  credentials: { username: string; password: string; mfaSecret?: string };
  dateStart: Date;
  dateEnd: Date;
  headless?: boolean;
}) {
  const { getEquals5Service } = await import("./service");
  const service = getEquals5Service({
    browserOptions: { headless: options.headless ?? true },
  });

  return service.fetchData(options.credentials, options.dateStart, options.dateEnd);
}

/**
 * Convenience function: Test login
 */
export async function testLogin(credentials: {
  username: string;
  password: string;
  mfaSecret?: string;
}) {
  const { getEquals5Service } = await import("./service");
  const service = getEquals5Service();

  return service.testLogin(credentials);
}
