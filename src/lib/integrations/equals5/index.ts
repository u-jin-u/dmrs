/**
 * Equals 5 Integration
 *
 * Browser automation for extracting data from Equals 5 platform.
 * Since Equals 5 has no API, we use Playwright for web scraping.
 */

import { Browser, Page } from "playwright";
import { createBrowser, createContext, createPage, takeScreenshot } from "./browser";
import { login, isLoggedIn } from "./login";
import {
  Equals5Credentials,
  Equals5Data,
  ExtractionResult,
  BrowserOptions,
} from "./types";
import { Equals5Error, ExtractionError } from "./errors";

export * from "./types";
export * from "./errors";

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

interface FetchOptions {
  credentials: Equals5Credentials;
  dateStart: Date;
  dateEnd: Date;
  screenshotPath?: string;
  browserOptions?: BrowserOptions;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract data from Equals 5
 *
 * This is the main entry point for data extraction.
 */
export async function extractData(
  page: Page,
  dateStart: Date,
  dateEnd: Date,
  screenshotPath: string
): Promise<Equals5Data> {
  // TODO: Implement actual data extraction once login flow is verified
  // This will involve:
  // 1. Navigate to reports/export section
  // 2. Set date range
  // 3. Click export button
  // 4. Download and parse the Excel file

  throw new ExtractionError(
    "Data extraction not yet implemented. Run the explore script first to map the UI."
  );
}

/**
 * Fetch Equals 5 data with automatic retry logic
 */
export async function fetchEquals5Data(
  options: FetchOptions
): Promise<ExtractionResult> {
  const {
    credentials,
    dateStart,
    dateEnd,
    screenshotPath = "./tmp/equals5",
    browserOptions = {},
  } = options;

  let lastError: Error | null = null;
  let browser: Browser | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Equals 5 extraction attempt ${attempt}/${MAX_RETRIES}`);

      browser = await createBrowser(browserOptions);
      const context = await createContext(browser, browserOptions);
      const page = await createPage(context);

      // Login
      await login(page, credentials, screenshotPath);

      // Verify login was successful
      if (!(await isLoggedIn(page))) {
        throw new Equals5Error("Login appeared to succeed but user is not logged in");
      }

      // Extract data
      const data = await extractData(page, dateStart, dateEnd, screenshotPath);

      return {
        success: true,
        data,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt} failed:`, lastError.message);

      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await sleep(RETRY_DELAY);
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // All retries failed
  const screenshotFile = lastError instanceof Equals5Error
    ? lastError.screenshotPath
    : undefined;

  return {
    success: false,
    error: `Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
    screenshotPath: screenshotFile,
  };
}

/**
 * Test the login flow without extracting data
 */
export async function testLogin(
  credentials: Equals5Credentials,
  options: BrowserOptions = {}
): Promise<{ success: boolean; error?: string; screenshotPath?: string }> {
  const screenshotPath = "./tmp/equals5-test";
  let browser: Browser | null = null;

  try {
    browser = await createBrowser({ ...options, headless: false });
    const context = await createContext(browser, options);
    const page = await createPage(context);

    await login(page, credentials, screenshotPath);

    const loggedIn = await isLoggedIn(page);

    await takeScreenshot(page, screenshotPath, "test-complete");

    return {
      success: loggedIn,
      error: loggedIn ? undefined : "Login did not result in logged-in state",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      screenshotPath: error instanceof Equals5Error ? error.screenshotPath : undefined,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
