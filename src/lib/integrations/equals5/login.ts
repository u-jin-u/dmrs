/**
 * Equals 5 Login Automation
 */

import { Page } from "playwright";
import { Equals5Credentials, SELECTORS } from "./types";
import { LoginError, MfaRequiredError } from "./errors";
import {
  waitForPageReady,
  takeScreenshot,
  typeHumanLike,
  humanDelay,
} from "./browser";

const EQUALS5_BASE_URL = "https://app.equals5.com";

/**
 * Navigate to the login page
 */
export async function navigateToLogin(page: Page): Promise<void> {
  await page.goto(EQUALS5_BASE_URL, {
    waitUntil: "networkidle",
  });

  // Wait for the app to fully load (SPA)
  await humanDelay(1000, 2000);
  await waitForPageReady(page);
}

/**
 * Perform login with credentials
 */
export async function login(
  page: Page,
  credentials: Equals5Credentials,
  screenshotPath: string
): Promise<void> {
  const { login: selectors } = SELECTORS;

  try {
    // Navigate to login
    await navigateToLogin(page);

    // Wait for login form to be visible
    // Try multiple possible selectors
    const emailInput = await page.waitForSelector(selectors.emailInput, {
      timeout: 10000,
    });

    if (!emailInput) {
      throw new LoginError("Could not find email/username input field");
    }

    // Take screenshot of login page for debugging
    await takeScreenshot(page, screenshotPath, "01-login-page");

    // Enter email/username with human-like typing
    await typeHumanLike(page, selectors.emailInput, credentials.username);
    await humanDelay(300, 600);

    // Enter password
    await typeHumanLike(page, selectors.passwordInput, credentials.password);
    await humanDelay(300, 600);

    // Take screenshot before submitting
    await takeScreenshot(page, screenshotPath, "02-credentials-entered");

    // Click submit button
    await page.click(selectors.submitButton);

    // Wait for navigation or response
    await Promise.race([
      page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 }),
      page.waitForSelector(selectors.errorMessage, { timeout: 10000 }),
    ]).catch(() => {
      // Navigation might not trigger if it's a SPA
    });

    await humanDelay(1000, 2000);

    // Check for MFA requirement
    const mfaInput = await page.$(selectors.mfaInput);
    if (mfaInput) {
      if (!credentials.mfaSecret) {
        await takeScreenshot(page, screenshotPath, "03-mfa-required");
        throw new MfaRequiredError();
      }

      // TODO: Implement TOTP generation if MFA secret is provided
      // const totp = generateTOTP(credentials.mfaSecret);
      // await typeHumanLike(page, selectors.mfaInput, totp);
      // await page.click(selectors.submitButton);
    }

    // Check for error message
    const errorElement = await page.$(selectors.errorMessage);
    if (errorElement) {
      const errorText = await errorElement.textContent();
      await takeScreenshot(page, screenshotPath, "03-login-error");
      throw new LoginError(errorText || "Unknown login error");
    }

    // Verify successful login by checking for dashboard elements
    // This will need adjustment based on actual Equals 5 post-login page
    await page.waitForTimeout(2000); // Wait for SPA to settle

    // Take screenshot of post-login state
    await takeScreenshot(page, screenshotPath, "04-post-login");

    console.log("Login successful");
  } catch (error) {
    if (
      error instanceof LoginError ||
      error instanceof MfaRequiredError
    ) {
      throw error;
    }

    // Capture screenshot on unexpected error
    await takeScreenshot(page, screenshotPath, "error-login");
    throw new LoginError(
      `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for common logged-in indicators
  // This will need adjustment based on actual Equals 5 UI
  const indicators = [
    SELECTORS.nav.dashboard,
    SELECTORS.nav.reports,
    'a[href*="logout"]',
    ".user-menu",
    ".avatar",
  ];

  for (const selector of indicators) {
    try {
      const element = await page.$(selector);
      if (element) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

/**
 * Logout from Equals 5
 */
export async function logout(page: Page): Promise<void> {
  try {
    // Find and click logout button/link
    const logoutSelectors = [
      'a[href*="logout"]',
      'button:has-text("Logout")',
      'button:has-text("Sign out")',
      ".logout-btn",
    ];

    for (const selector of logoutSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          await waitForPageReady(page);
          return;
        }
      } catch {
        continue;
      }
    }

    console.warn("Could not find logout button");
  } catch (error) {
    console.error("Logout failed:", error);
  }
}
