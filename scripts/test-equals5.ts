/**
 * Test Equals 5 Automation
 *
 * Downloads stats for December 2025 via Export and parses the XLSX file
 */

import { createBrowser, createContext, createPage, takeScreenshot, humanDelay } from "../src/lib/integrations/equals5/browser";
import { login, isLoggedIn } from "../src/lib/integrations/equals5/login";
import { parseExportFile } from "../src/lib/integrations/equals5/parser";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=== Equals 5 Automation Test (Export Method) ===\n");

  const credentials = {
    username: process.env.EQUALS5_USERNAME || "healio@equals5.com",
    password: process.env.EQUALS5_PASSWORD || "ffYSgKTe",
  };

  // December 2025 date range
  const dateStart = new Date("2025-12-01");
  const dateEnd = new Date("2025-12-31");

  const screenshotPath = "./tmp/equals5/test-session";
  const downloadPath = "./tmp/equals5/downloads";
  fs.mkdirSync(screenshotPath, { recursive: true });
  fs.mkdirSync(downloadPath, { recursive: true });

  console.log(`Credentials: ${credentials.username}`);
  console.log(`Date Range: ${dateStart.toISOString().split("T")[0]} to ${dateEnd.toISOString().split("T")[0]}`);
  console.log("\nStarting automation (headless: false for visibility)...\n");

  const browser = await createBrowser({ headless: false });

  try {
    const context = await createContext(browser);
    const page = await createPage(context);

    // Step 1: Login
    console.log("Step 1: Logging in...");
    await login(page, credentials, screenshotPath);

    if (!(await isLoggedIn(page))) {
      throw new Error("Login failed");
    }
    console.log("Login successful!\n");

    // Step 2: Set date range to December 2025
    console.log("Step 2: Setting date range to December 2025...");

    // Click the Date Range button in toolbar
    console.log("Opening date picker...");
    const dateRangeButton = await page.locator('text="Date Range"').first();
    await dateRangeButton.click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, screenshotPath, "date-picker-open");

    // Click "Last month" preset
    console.log("Selecting Last month...");
    const lastMonthPreset = await page.locator('text="Last month"');
    await lastMonthPreset.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, screenshotPath, "after-last-month");

    // Click Apply button
    console.log("Clicking Apply...");
    const applyButton = await page.locator('button:has-text("Apply")');
    await applyButton.click();
    await page.waitForTimeout(3000);
    await takeScreenshot(page, screenshotPath, "after-date-range");
    console.log("Date range set!\n");

    // Step 3: Click Export and download file
    console.log("Step 3: Exporting data...");

    // Set up download handler before clicking export
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

    // Click Export button
    console.log("Clicking Export button...");
    const exportButton = await page.locator('text="Export"').first();
    await exportButton.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, screenshotPath, "export-clicked");

    // Wait for download
    console.log("Waiting for download...");
    const download = await downloadPromise;

    // Save the file
    const suggestedName = download.suggestedFilename() || `equals5-export-${Date.now()}.xlsx`;
    const filePath = path.join(downloadPath, suggestedName);
    await download.saveAs(filePath);
    console.log(`Downloaded: ${filePath}\n`);

    // Step 4: Parse the downloaded file
    console.log("Step 4: Parsing downloaded file...");
    const data = parseExportFile(filePath, dateStart, dateEnd);

    console.log("\n=== Extracted Data from Export ===");
    console.log("- Impressions:", data.impressions?.toLocaleString());
    console.log("- Identified Impressions:", data.identifiedImpressions?.toLocaleString());
    console.log("- Clicks:", data.clicks?.toLocaleString());
    console.log("- Identified Clicks:", data.identifiedClicks?.toLocaleString());
    console.log("- Avg CTR:", data.avgCtr, "%");
    console.log("- Reach:", data.reach?.toLocaleString());
    console.log("- Visits Media:", data.visitsMedia?.toLocaleString());
    console.log("- Clicks Media:", data.clicksMedia?.toLocaleString());
    console.log("- Signals:", data.signals?.toLocaleString());
    console.log("- Spend:", data.spend?.toLocaleString() || "N/A");

    // Show raw data sample
    const rawRows = (data.rawData as any)?.rows;
    if (rawRows && Array.isArray(rawRows)) {
      console.log(`\nTotal rows in export: ${rawRows.length}`);
      console.log("\nFirst 3 rows sample:");
      rawRows.slice(0, 3).forEach((row: any, i: number) => {
        console.log(`  Row ${i + 1}:`, JSON.stringify(row).substring(0, 200) + "...");
      });
    }

    // Take final screenshot
    await takeScreenshot(page, screenshotPath, "final-result");

    console.log("\n=== Success! ===");
    console.log(`Export file saved at: ${filePath}`);
  } catch (error) {
    console.error("\n=== Error ===");
    console.error(error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
