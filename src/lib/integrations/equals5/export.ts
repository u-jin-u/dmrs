/**
 * Equals 5 Export Automation
 *
 * Handles date range selection and data export
 */

import { Page, Download } from "playwright";
import { SELECTORS, EQUALS5_URLS } from "./types";
import { ExtractionError, TimeoutError, NavigationError } from "./errors";
import { takeScreenshot, waitForPageReady, humanDelay } from "./browser";
import * as fs from "fs";
import * as path from "path";

/**
 * Format date for Equals 5 date picker (MM/DD/YYYY)
 */
function formatDateForInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Navigate to campaigns page
 */
export async function navigateToCampaigns(page: Page): Promise<void> {
  const currentUrl = page.url();

  if (!currentUrl.includes("/app/campaigns")) {
    await page.goto(EQUALS5_URLS.campaigns, { waitUntil: "networkidle" });
    await humanDelay(1000, 2000);
    await waitForPageReady(page);
  }
}

/**
 * Set date range for data export
 */
export async function setDateRange(
  page: Page,
  startDate: Date,
  endDate: Date,
  screenshotPath: string
): Promise<void> {
  const { dateRange: selectors, toolbar } = SELECTORS;

  try {
    // Click the date range button in toolbar
    const dateRangeButton = await page.waitForSelector(toolbar.dateRange, {
      timeout: 10000,
    });

    if (!dateRangeButton) {
      throw new ExtractionError("Date range button not found");
    }

    await dateRangeButton.click();
    await humanDelay(500, 1000);

    // Wait for date picker to open
    const datePickerVisible = await page.waitForSelector(
      `${selectors.startDate}, input[type="date"]`,
      { timeout: 5000 }
    ).catch(() => null);

    if (!datePickerVisible) {
      // Try alternative: clicking might open a different type of picker
      await takeScreenshot(page, screenshotPath, "date-picker-opened");
      console.log("Date picker structure may differ - check screenshot");
    }

    // Try multiple strategies for date input
    await setDateInputs(page, startDate, endDate);

    // Take screenshot of date selection
    await takeScreenshot(page, screenshotPath, "date-range-set");

    // Apply the date range
    const applyButton = await page.$(selectors.applyButton);
    if (applyButton) {
      await applyButton.click();
      await humanDelay(1000, 2000);
    }

    await waitForPageReady(page);
  } catch (error) {
    await takeScreenshot(page, screenshotPath, "date-range-error");
    throw new ExtractionError(
      `Failed to set date range: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Navigate calendar to a specific month/year
 */
async function navigateCalendarToMonth(
  page: Page,
  targetYear: number,
  targetMonth: number // 0-indexed (0 = January)
): Promise<void> {
  // Get current displayed month/year from calendar header
  // Format: "Jan 2026" or similar
  const getDisplayedDate = async () => {
    const headerText = await page.textContent('[class*="calendar"] >> text=/[A-Za-z]+ \\d{4}/');
    if (!headerText) return null;
    const match = headerText.match(/([A-Za-z]+)\s+(\d{4})/);
    if (!match) return null;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = months.findIndex(m => match[1].startsWith(m));
    return { month: monthIdx, year: parseInt(match[2]) };
  };

  // Click previous month button until we reach target
  let attempts = 0;
  const maxAttempts = 24; // Max 2 years back

  while (attempts < maxAttempts) {
    const current = await getDisplayedDate();
    if (!current) {
      console.warn("Could not determine current calendar month");
      break;
    }

    if (current.year === targetYear && current.month === targetMonth) {
      break;
    }

    // Need to go back
    if (current.year > targetYear || (current.year === targetYear && current.month > targetMonth)) {
      // Click previous button (<<)
      const prevButton = await page.$('button:has-text("<<"), [aria-label*="previous"], button >> text=/<|«/');
      if (prevButton) {
        await prevButton.click();
        await humanDelay(200, 400);
      } else {
        console.warn("Could not find previous month button");
        break;
      }
    } else {
      break; // We're at or past target
    }

    attempts++;
  }
}

/**
 * Set date inputs using various strategies
 */
async function setDateInputs(
  page: Page,
  startDate: Date,
  endDate: Date
): Promise<void> {
  const { dateRange: selectors } = SELECTORS;
  const startDateStr = formatDateForInput(startDate);
  const endDateStr = formatDateForInput(endDate);

  // Strategy 1: Use period input field if available
  try {
    const periodInput = await page.$('input[placeholder*="Period"], input:near(:text("Period"))');
    if (periodInput) {
      // Clear and type the date range in format: MM/DD/YYYY - MM/DD/YYYY
      await periodInput.fill(`${startDateStr} - ${endDateStr}`);
      await humanDelay(300, 500);
      return;
    }
  } catch {
    // Try next strategy
  }

  // Strategy 2: Click "Last month" preset if December
  if (startDate.getMonth() === 11) { // December
    try {
      const lastMonthPreset = await page.$('text="Last month"');
      if (lastMonthPreset) {
        await lastMonthPreset.click();
        await humanDelay(500, 1000);
        return;
      }
    } catch {
      // Try next strategy
    }
  }

  // Strategy 3: Navigate calendar and click dates
  try {
    // Navigate to the start month
    await navigateCalendarToMonth(page, startDate.getFullYear(), startDate.getMonth());

    // Click start date
    const startDay = startDate.getDate().toString();
    const startDayButton = await page.$(`td:has-text("${startDay}"):not([class*="disabled"])`);
    if (startDayButton) {
      await startDayButton.click();
      await humanDelay(200, 400);
    }

    // Click end date
    const endDay = endDate.getDate().toString();
    const endDayButton = await page.$(`td:has-text("${endDay}"):not([class*="disabled"]) >> nth=-1`);
    if (endDayButton) {
      await endDayButton.click();
      await humanDelay(200, 400);
    }

    return;
  } catch {
    // Try next strategy
  }

  // Strategy 4: Direct input fill
  try {
    const startInput = await page.$(selectors.startDate);
    const endInput = await page.$(selectors.endDate);

    if (startInput && endInput) {
      await startInput.fill(startDateStr);
      await humanDelay(300, 500);
      await endInput.fill(endDateStr);
      return;
    }
  } catch {
    // Try next strategy
  }

  console.warn("Could not fill date inputs directly - manual verification needed");
}

/**
 * Click export button and handle download
 */
export async function triggerExport(
  page: Page,
  screenshotPath: string,
  downloadPath: string
): Promise<string> {
  const { toolbar, export: exportSelectors } = SELECTORS;

  try {
    // Click export button in toolbar
    const exportButton = await page.waitForSelector(toolbar.export, {
      timeout: 10000,
    });

    if (!exportButton) {
      throw new ExtractionError("Export button not found");
    }

    await exportButton.click();
    await humanDelay(500, 1000);

    // Take screenshot of export options
    await takeScreenshot(page, screenshotPath, "export-dialog");

    // Look for Excel/XLSX option
    const excelOption = await page.$(exportSelectors.excelOption);
    if (excelOption) {
      await excelOption.click();
      await humanDelay(300, 500);
    }

    // Wait for download
    const downloadedFile = await waitForDownload(page, downloadPath, screenshotPath);

    return downloadedFile;
  } catch (error) {
    await takeScreenshot(page, screenshotPath, "export-error");

    if (error instanceof ExtractionError || error instanceof TimeoutError) {
      throw error;
    }

    throw new ExtractionError(
      `Failed to export data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Wait for and handle file download
 */
async function waitForDownload(
  page: Page,
  downloadPath: string,
  screenshotPath: string
): Promise<string> {
  // Ensure download directory exists
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new TimeoutError("Download", screenshotPath));
    }, 60000); // 60 second timeout for download

    try {
      // Set up download handler
      const downloadPromise = page.waitForEvent("download", { timeout: 30000 });

      // Try clicking download/export button if visible
      const downloadButton = await page.$(SELECTORS.export.downloadButton);
      if (downloadButton) {
        await downloadButton.click();
      } else {
        // Might have auto-started download
        console.log("No download button found, waiting for auto-download...");
      }

      // Wait for download event
      const download: Download = await downloadPromise;

      // Generate filename
      const suggestedFilename = download.suggestedFilename() || `equals5-export-${Date.now()}.xlsx`;
      const filePath = path.join(downloadPath, suggestedFilename);

      // Save to path
      await download.saveAs(filePath);

      clearTimeout(timeout);
      console.log(`Downloaded file saved to: ${filePath}`);
      resolve(filePath);
    } catch (error) {
      clearTimeout(timeout);
      reject(new ExtractionError(
        `Download failed: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  });
}

/**
 * Full export flow: set date range and download data
 */
export async function exportData(
  page: Page,
  startDate: Date,
  endDate: Date,
  screenshotPath: string,
  downloadPath: string
): Promise<string> {
  // Ensure we're on the campaigns page
  await navigateToCampaigns(page);
  await takeScreenshot(page, screenshotPath, "campaigns-page");

  // Set date range
  await setDateRange(page, startDate, endDate, screenshotPath);

  // Trigger export and get file path
  const filePath = await triggerExport(page, screenshotPath, downloadPath);

  return filePath;
}
