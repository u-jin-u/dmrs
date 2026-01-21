/**
 * Equals 5 Explorer Script
 *
 * Run this with: npx tsx src/lib/integrations/equals5/explore.ts
 *
 * This script helps discover the UI structure of Equals 5 by:
 * 1. Opening the browser in headed mode
 * 2. Navigating to the login page
 * 3. Taking screenshots at each step
 * 4. Logging all found elements
 *
 * Usage:
 *   EQUALS5_USERNAME=your@email.com EQUALS5_PASSWORD=yourpassword npx tsx src/lib/integrations/equals5/explore.ts
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const EQUALS5_URL = "https://app.equals5.com";
const SCREENSHOT_DIR = "./tmp/equals5-exploration";

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function exploreEquals5() {
  // Get credentials from environment
  const username = process.env.EQUALS5_USERNAME;
  const password = process.env.EQUALS5_PASSWORD;

  if (!username || !password) {
    console.error("Missing credentials. Set EQUALS5_USERNAME and EQUALS5_PASSWORD environment variables.");
    console.error("\nUsage:");
    console.error("  EQUALS5_USERNAME=your@email.com EQUALS5_PASSWORD=yourpassword npx tsx src/lib/integrations/equals5/explore.ts");
    process.exit(1);
  }

  await ensureDir(SCREENSHOT_DIR);
  console.log(`Screenshots will be saved to: ${path.resolve(SCREENSHOT_DIR)}`);

  // Launch browser in headed mode so we can see what's happening
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100, // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: SCREENSHOT_DIR }, // Record video for analysis
  });

  const page = await context.newPage();

  try {
    console.log("\n=== STEP 1: Navigate to Equals 5 ===");
    await page.goto(EQUALS5_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000); // Wait for SPA to load

    // Take screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-initial-page.png`,
      fullPage: true,
    });
    console.log("Screenshot: 01-initial-page.png");

    // Log page title and URL
    console.log(`Title: ${await page.title()}`);
    console.log(`URL: ${page.url()}`);

    // Find all input fields
    console.log("\n=== INPUT FIELDS FOUND ===");
    const inputs = await page.$$("input");
    for (const input of inputs) {
      const type = await input.getAttribute("type");
      const name = await input.getAttribute("name");
      const id = await input.getAttribute("id");
      const placeholder = await input.getAttribute("placeholder");
      console.log(`  - type="${type}" name="${name}" id="${id}" placeholder="${placeholder}"`);
    }

    // Find all buttons
    console.log("\n=== BUTTONS FOUND ===");
    const buttons = await page.$$("button");
    for (const button of buttons) {
      const text = await button.textContent();
      const type = await button.getAttribute("type");
      const className = await button.getAttribute("class");
      console.log(`  - "${text?.trim()}" type="${type}" class="${className}"`);
    }

    // Find all links
    console.log("\n=== LINKS FOUND ===");
    const links = await page.$$("a");
    for (const link of links) {
      const text = await link.textContent();
      const href = await link.getAttribute("href");
      if (href && text?.trim()) {
        console.log(`  - "${text.trim()}" href="${href}"`);
      }
    }

    console.log("\n=== STEP 2: Attempt Login ===");

    // Try to find email input using various selectors
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[id="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="username" i]',
    ];

    let emailInput = null;
    for (const selector of emailSelectors) {
      emailInput = await page.$(selector);
      if (emailInput) {
        console.log(`Found email input with selector: ${selector}`);
        break;
      }
    }

    if (!emailInput) {
      console.log("Could not find email input automatically.");
      console.log("\nPlease manually identify the login form structure.");
      console.log("The browser will stay open for 60 seconds for inspection.");
      await page.waitForTimeout(60000);
      return;
    }

    // Enter credentials
    await emailInput.fill(username);

    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      passwordInput = await page.$(selector);
      if (passwordInput) {
        console.log(`Found password input with selector: ${selector}`);
        break;
      }
    }

    if (passwordInput) {
      await passwordInput.fill(password);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-filled-credentials.png`,
      fullPage: true,
    });
    console.log("Screenshot: 02-filled-credentials.png");

    // Find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
      'button:has-text("Login")',
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      submitButton = await page.$(selector);
      if (submitButton) {
        console.log(`Found submit button with selector: ${selector}`);
        break;
      }
    }

    if (submitButton) {
      await submitButton.click();
      console.log("Clicked submit button");

      // Wait for navigation or page update
      await page.waitForTimeout(5000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-after-login.png`,
        fullPage: true,
      });
      console.log("Screenshot: 03-after-login.png");
      console.log(`URL after login: ${page.url()}`);

      // Check for error messages
      const errorSelectors = [".error", ".alert", '[role="alert"]', ".message"];
      for (const selector of errorSelectors) {
        const error = await page.$(selector);
        if (error) {
          const errorText = await error.textContent();
          if (errorText?.trim()) {
            console.log(`Possible error message: "${errorText.trim()}"`);
          }
        }
      }

      // Explore post-login page
      console.log("\n=== POST-LOGIN EXPLORATION ===");

      // Find navigation elements
      const navLinks = await page.$$("nav a, [role='navigation'] a, .sidebar a, .menu a");
      console.log("\nNavigation links found:");
      for (const link of navLinks) {
        const text = await link.textContent();
        const href = await link.getAttribute("href");
        if (text?.trim()) {
          console.log(`  - "${text.trim()}" href="${href}"`);
        }
      }

      // Look for report/export related links
      console.log("\nSearching for report/export related elements...");
      const reportKeywords = ["report", "export", "download", "analytics", "data"];
      const allLinks = await page.$$("a");

      for (const link of allLinks) {
        const text = (await link.textContent())?.toLowerCase() || "";
        const href = (await link.getAttribute("href"))?.toLowerCase() || "";

        for (const keyword of reportKeywords) {
          if (text.includes(keyword) || href.includes(keyword)) {
            const displayText = await link.textContent();
            const displayHref = await link.getAttribute("href");
            console.log(`  Found: "${displayText?.trim()}" href="${displayHref}"`);
            break;
          }
        }
      }
    }

    // Keep browser open for manual inspection
    console.log("\n=== MANUAL INSPECTION ===");
    console.log("Browser will stay open for 2 minutes for manual inspection.");
    console.log("Press Ctrl+C to close earlier.");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.error("Error during exploration:", error);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/error-state.png`,
      fullPage: true,
    });
    console.log("Error screenshot saved: error-state.png");

  } finally {
    await context.close();
    await browser.close();
    console.log("\nExploration complete. Check the screenshots in:", path.resolve(SCREENSHOT_DIR));
  }
}

// Run the exploration
exploreEquals5().catch(console.error);
