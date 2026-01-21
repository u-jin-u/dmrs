/**
 * Equals 5 Service Layer
 *
 * High-level service for automated data extraction
 */

import { Browser } from "playwright";
import {
  Equals5Credentials,
  Equals5Data,
  ExtractionResult,
  BrowserOptions,
} from "./types";
import {
  Equals5Error,
  LoginError,
  ExtractionError,
  TimeoutError,
} from "./errors";
import { createBrowser, createContext, createPage, takeScreenshot } from "./browser";
import { login, isLoggedIn, logout } from "./login";
import { exportData } from "./export";
import { parseExportFile, validateParsedData } from "./parser";
import * as fs from "fs";
import * as path from "path";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 5000;
const DEFAULT_SCREENSHOT_PATH = "./tmp/equals5";
const DEFAULT_DOWNLOAD_PATH = "./tmp/equals5/downloads";

export interface Equals5ServiceConfig {
  maxRetries?: number;
  retryDelay?: number;
  screenshotPath?: string;
  downloadPath?: string;
  browserOptions?: BrowserOptions;
}

export interface FetchResult {
  success: boolean;
  data?: Equals5Data;
  error?: string;
  screenshotPath?: string;
  warnings?: string[];
}

/**
 * Equals 5 Service for managing data extraction
 */
export class Equals5Service {
  private config: Required<Equals5ServiceConfig>;

  constructor(config: Equals5ServiceConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      retryDelay: config.retryDelay ?? DEFAULT_RETRY_DELAY,
      screenshotPath: config.screenshotPath ?? DEFAULT_SCREENSHOT_PATH,
      downloadPath: config.downloadPath ?? DEFAULT_DOWNLOAD_PATH,
      browserOptions: config.browserOptions ?? { headless: true },
    };

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Ensure screenshot and download directories exist
   */
  private ensureDirectories(): void {
    [this.config.screenshotPath, this.config.downloadPath].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetch data from Equals 5
   */
  async fetchData(
    credentials: Equals5Credentials,
    dateStart: Date,
    dateEnd: Date
  ): Promise<FetchResult> {
    let lastError: Error | null = null;
    let browser: Browser | null = null;

    // Create unique session directory
    const sessionId = Date.now();
    const sessionScreenshotPath = path.join(
      this.config.screenshotPath,
      `session-${sessionId}`
    );
    const sessionDownloadPath = path.join(
      this.config.downloadPath,
      `session-${sessionId}`
    );

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(
          `Equals 5 extraction attempt ${attempt}/${this.config.maxRetries}`
        );

        // Create browser
        browser = await createBrowser(this.config.browserOptions);
        const context = await createContext(browser, this.config.browserOptions);
        const page = await createPage(context);

        // Login
        await login(page, credentials, sessionScreenshotPath);

        // Verify login
        if (!(await isLoggedIn(page))) {
          throw new LoginError("Login appeared to succeed but user is not logged in");
        }

        // Export data
        const downloadedFilePath = await exportData(
          page,
          dateStart,
          dateEnd,
          sessionScreenshotPath,
          sessionDownloadPath
        );

        // Parse exported file
        const data = parseExportFile(downloadedFilePath, dateStart, dateEnd);

        // Validate parsed data
        const validation = validateParsedData(data);

        // Logout
        try {
          await logout(page);
        } catch {
          // Ignore logout errors
        }

        // Clean up downloaded file (optional - keep for debugging)
        // fs.unlinkSync(downloadedFilePath);

        return {
          success: true,
          data,
          warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Attempt ${attempt} failed:`, lastError.message);

        // Take error screenshot
        if (browser) {
          try {
            const pages = browser.contexts()[0]?.pages() || [];
            if (pages.length > 0) {
              await takeScreenshot(
                pages[0],
                sessionScreenshotPath,
                `error-attempt-${attempt}`
              );
            }
          } catch {
            // Ignore screenshot errors
          }
        }

        if (attempt < this.config.maxRetries) {
          console.log(`Retrying in ${this.config.retryDelay / 1000} seconds...`);
          await this.sleep(this.config.retryDelay);
        }
      } finally {
        if (browser) {
          await browser.close().catch(() => {});
          browser = null;
        }
      }
    }

    // All retries failed
    return {
      success: false,
      error: `Failed after ${this.config.maxRetries} attempts: ${lastError?.message}`,
      screenshotPath:
        lastError instanceof Equals5Error ? lastError.screenshotPath : undefined,
    };
  }

  /**
   * Test login without extracting data
   */
  async testLogin(credentials: Equals5Credentials): Promise<{
    success: boolean;
    error?: string;
    screenshotPath?: string;
  }> {
    const sessionScreenshotPath = path.join(
      this.config.screenshotPath,
      `test-${Date.now()}`
    );
    let browser: Browser | null = null;

    try {
      // Use headful browser for testing
      browser = await createBrowser({
        ...this.config.browserOptions,
        headless: false,
      });
      const context = await createContext(browser, this.config.browserOptions);
      const page = await createPage(context);

      await login(page, credentials, sessionScreenshotPath);

      const loggedIn = await isLoggedIn(page);
      await takeScreenshot(page, sessionScreenshotPath, "test-complete");

      return {
        success: loggedIn,
        error: loggedIn ? undefined : "Login did not result in logged-in state",
        screenshotPath: sessionScreenshotPath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        screenshotPath:
          error instanceof Equals5Error ? error.screenshotPath : undefined,
      };
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  /**
   * Validate credentials format (not actual login)
   */
  validateCredentials(credentials: Equals5Credentials): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!credentials.username || credentials.username.trim() === "") {
      errors.push("Username is required");
    }

    if (!credentials.password || credentials.password.trim() === "") {
      errors.push("Password is required");
    }

    // Basic email format check
    if (credentials.username && !credentials.username.includes("@")) {
      errors.push("Username should be an email address");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Create singleton service instance
 */
let serviceInstance: Equals5Service | null = null;

export function getEquals5Service(
  config?: Equals5ServiceConfig
): Equals5Service {
  if (!serviceInstance) {
    serviceInstance = new Equals5Service(config);
  }
  return serviceInstance;
}

/**
 * Create a new service instance (for testing or custom configs)
 */
export function createEquals5Service(
  config: Equals5ServiceConfig
): Equals5Service {
  return new Equals5Service(config);
}
