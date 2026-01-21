/**
 * Equals 5 Data Scraper
 *
 * Scrapes data directly from the campaigns table
 */

import { Page } from "playwright";
import { Equals5Data } from "./types";
import { ExtractionError } from "./errors";
import { takeScreenshot, humanDelay } from "./browser";

/**
 * Scrape aggregate data from the campaigns table footer
 */
export async function scrapeTableData(
  page: Page,
  dateStart: Date,
  dateEnd: Date,
  screenshotPath: string
): Promise<Equals5Data> {
  try {
    // Close any open dialogs first
    const cancelButton = await page.$('button:has-text("Cancel")');
    if (cancelButton) {
      await cancelButton.click();
      await humanDelay(500, 1000);
    }

    // Wait for table to be fully loaded
    await page.waitForSelector('text=/Total of:/i', { timeout: 15000 });
    await humanDelay(1000, 2000);

    // Take screenshot of table
    await takeScreenshot(page, screenshotPath, "table-data");

    // Get the footer row with totals
    // The footer shows: Total of: X | values...
    const footerText = await page.evaluate(() => {
      // Find the element containing "Total of:"
      const totalElement = document.body.innerText;
      const lines = totalElement.split('\n');
      const totalLine = lines.find(line => line.includes('Total of:'));
      return totalLine || '';
    });

    console.log("Footer text:", footerText);

    // Parse the footer - format is typically:
    // "1-50 of 104    Total of: 104    463,455    17,867,022    11,646,057    54,256    50,975    0.3%    231,248    21,920    52,449    74,385"

    // Get column headers to understand the data structure
    const headers = await page.evaluate(() => {
      const headerCells = document.querySelectorAll('th, [role="columnheader"]');
      return Array.from(headerCells).map(cell => cell.textContent?.trim() || '');
    });

    console.log("Headers:", headers);

    // Try to get the totals row values
    const totals = await page.evaluate(() => {
      // Look for the footer/totals area
      const pageText = document.body.innerText;

      // Find "Total of:" and extract the numbers after it
      const totalMatch = pageText.match(/Total of:\s*(\d+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d.]+%?)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/);

      if (totalMatch) {
        return {
          totalCampaigns: totalMatch[1],
          col1: totalMatch[2],
          col2: totalMatch[3],
          col3: totalMatch[4],
          col4: totalMatch[5],
          col5: totalMatch[6],
          col6: totalMatch[7],
          col7: totalMatch[8],
          col8: totalMatch[9],
          col9: totalMatch[10],
          col10: totalMatch[11],
        };
      }

      return null;
    });

    console.log("Totals:", totals);

    if (!totals) {
      throw new ExtractionError("Could not find totals row in table");
    }

    // Map the values based on typical column order:
    // Targets, Impressions, Identified Impressions, Clicks, Identified Clicks, Avg CTR, Reach, Visits: Media, Clicks: Media, Signals
    const parseNum = (s: string) => parseInt(s.replace(/,/g, ''), 10) || 0;
    const parsePercent = (s: string) => parseFloat(s.replace('%', '')) || 0;

    return {
      impressions: parseNum(totals.col2),
      identifiedImpressions: parseNum(totals.col3),
      clicks: parseNum(totals.col4),
      identifiedClicks: parseNum(totals.col5),
      avgCtr: parsePercent(totals.col6),
      reach: parseNum(totals.col7),
      visitsMedia: parseNum(totals.col8),
      clicksMedia: parseNum(totals.col9),
      signals: parseNum(totals.col10),
      spend: undefined, // Not visible in table
      rawData: {
        totalCampaigns: parseNum(totals.totalCampaigns),
        targets: parseNum(totals.col1),
        headers,
        scrapedAt: new Date().toISOString(),
      },
      dateStart,
      dateEnd,
      extractedAt: new Date(),
    };
  } catch (error) {
    await takeScreenshot(page, screenshotPath, "scrape-error");
    throw new ExtractionError(
      `Failed to scrape table data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Close any open side panels
 */
export async function closeOpenPanels(page: Page): Promise<void> {
  try {
    // Look for close button (X) in panels
    const closeButton = await page.$('button[aria-label="Close"], .close-button, svg.close');
    if (closeButton) {
      await closeButton.click();
      await humanDelay(500, 1000);
    }
  } catch {
    // Ignore if no panel is open
  }
}

/**
 * Select all campaigns in the table
 */
export async function selectAllCampaigns(page: Page): Promise<void> {
  try {
    // Click the checkbox in the header to select all
    const selectAllCheckbox = await page.$('thead input[type="checkbox"], th input[type="checkbox"]');
    if (selectAllCheckbox) {
      await selectAllCheckbox.click();
      await humanDelay(500, 1000);
    }
  } catch (error) {
    console.warn("Could not select all campaigns:", error);
  }
}
