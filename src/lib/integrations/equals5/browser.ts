/**
 * Equals 5 Browser Setup
 *
 * Configures Playwright for human-like automation
 */

import { chromium, Browser, BrowserContext, Page } from "playwright";
import { BrowserOptions } from "./types";

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
];

const DEFAULT_OPTIONS: Required<BrowserOptions> = {
  headless: true,
  slowMo: 50, // Adds delay between actions for human-like behavior
  timeout: 60000, // 60 second default timeout
};

/**
 * Get a random user agent string
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Create a new browser instance
 */
export async function createBrowser(
  options: BrowserOptions = {}
): Promise<Browser> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMo,
  });

  return browser;
}

/**
 * Create a new browser context with realistic settings
 */
export async function createContext(
  browser: Browser,
  options: BrowserOptions = {}
): Promise<BrowserContext> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: getRandomUserAgent(),
    locale: "en-US",
    timezoneId: "America/New_York",
    // Accept downloads
    acceptDownloads: true,
  });

  // Set default timeout for all operations
  context.setDefaultTimeout(config.timeout);

  return context;
}

/**
 * Create a new page with common setup
 */
export async function createPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();

  // Block unnecessary resources for faster loading (optional)
  // await page.route('**/*.{png,jpg,jpeg,gif,svg,ico}', route => route.abort());

  return page;
}

/**
 * Wait for page to be fully loaded and idle
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}

/**
 * Take a screenshot with timestamp
 */
export async function takeScreenshot(
  page: Page,
  basePath: string,
  name: string
): Promise<string> {
  const timestamp = Date.now();
  const filename = `${name}-${timestamp}.png`;
  const fullPath = `${basePath}/${filename}`;

  await page.screenshot({
    path: fullPath,
    fullPage: true,
  });

  return fullPath;
}

/**
 * Type text with human-like delays
 */
export async function typeHumanLike(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  await page.click(selector);
  await page.fill(selector, ""); // Clear first

  // Type with slight randomization
  for (const char of text) {
    await page.type(selector, char, {
      delay: 50 + Math.random() * 100, // 50-150ms per character
    });
  }
}

/**
 * Random delay to simulate human behavior
 */
export async function humanDelay(
  min: number = 500,
  max: number = 1500
): Promise<void> {
  const delay = min + Math.random() * (max - min);
  await new Promise((resolve) => setTimeout(resolve, delay));
}
