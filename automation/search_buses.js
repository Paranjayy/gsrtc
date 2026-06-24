const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  // Launch the browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  // Network logs array
  const networkLogs = [];

  // Listen to network requests
  page.on('request', request => {
    // Only capture API or document requests, or POST requests to avoid listing every image/css/js asset
    const url = request.url();
    const method = request.method();
    const headers = request.headers();
    const postData = request.postData();

    if (url.includes('gsrtc.in') && (method === 'POST' || url.includes('/api/') || url.includes('/services/'))) {
      networkLogs.push({
        type: 'request',
        timestamp: new Date().toISOString(),
        url,
        method,
        headers,
        postData
      });
      console.log(`[REQ] ${method} ${url}`);
    }
  });

  // Listen to network responses
  page.on('response', async response => {
    const url = response.url();
    const method = response.request().method();
    if (url.includes('gsrtc.in') && (method === 'POST' || url.includes('/api/') || url.includes('/services/'))) {
      let body = null;
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('json')) {
          body = await response.json();
        } else if (contentType.includes('text') || contentType.includes('javascript') || contentType.includes('xml')) {
          body = await response.text();
        }
      } catch (err) {
        body = `[Error reading body: ${err.message}]`;
      }

      networkLogs.push({
        type: 'response',
        timestamp: new Date().toISOString(),
        url,
        status: response.status(),
        headers: response.headers(),
        body
      });
      console.log(`[RES] ${response.status()} ${url}`);
    }
  });

  try {
    console.log('Navigating to GSRTC website...');
    await page.goto('https://gsrtc.in/', { waitUntil: 'load', timeout: 60000 });
    
    // Take a screenshot of the home page
    await page.screenshot({ path: 'homepage.png' });
    console.log('Screenshot saved to homepage.png');

    // Wait a bit to let any popup load
    await page.waitForTimeout(3000);

    // Let's close any popup modal if it exists
    // Often modals have a close button like a cross or close text
    const closeBtnSelector = '.modal-header button.btn-close, .modal-footer button[data-bs-dismiss="modal"], button.close, #modalClose, .popup-close';
    const closeBtn = page.locator(closeBtnSelector).first();
    if (await closeBtn.isVisible()) {
      console.log('Closing popup modal...');
      await closeBtn.click();
    } else {
      // In case of any general button that looks like a close or dismiss
      console.log('No obvious popup modal found via common selectors. Let\'s check if we can click somewhere to dismiss it.');
    }

    // Let's wait a bit
    await page.screenshot({ path: 'homepage_after_popup.png' });

    // Fill search parameters
    console.log('Entering search criteria...');
    
    // Origin: JUNAGADH
    await page.fill('#matchStartPlaceA', 'JUNAGADH');
    await page.waitForTimeout(1000); // wait for autocomplete
    // Click the autocomplete suggestion if it appears
    const originSuggestion = page.locator('.ui-menu-item:has-text("JUNAGADH")').first();
    if (await originSuggestion.isVisible()) {
      await originSuggestion.click();
    } else {
      // Press down and enter
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // Destination: DHORAJI
    await page.fill('#matchEndPlaceA', 'DHORAJI');
    await page.waitForTimeout(1000); // wait for autocomplete
    // Click the autocomplete suggestion if it appears
    const destSuggestion = page.locator('.ui-menu-item:has-text("DHORAJI")').first();
    if (await destSuggestion.isVisible()) {
      await destSuggestion.click();
    } else {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // Date: next week
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const day = String(nextWeek.getDate()).padStart(2, '0');
    const month = String(nextWeek.getMonth() + 1).padStart(2, '0');
    const year = nextWeek.getFullYear();
    const dateString = `${day}-${month}-${year}`;
    
    console.log(`Setting date to: ${dateString}`);
    // Clear and fill the date field
    await page.locator('#datepickerOA').focus();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.fill('#datepickerOA', dateString);
    await page.keyboard.press('Escape'); // close date picker calendar if open

    // Passengers: 1 (default is 1, let's ensure it is 1)
    await page.selectOption('#selectNoOfPassengersA', '1');

    await page.screenshot({ path: 'search_form_filled.png' });

    // Click search
    console.log('Clicking search button...');
    await page.click('button.btn-search');
    
    // Wait for the results to load
    console.log('Waiting for search results...');
    await page.waitForTimeout(5000); // Wait for the transition to finish or new page to load

    await page.screenshot({ path: 'search_results.png' });
    
    // Save page HTML to inspect structure
    const html = await page.content();
    fs.writeFileSync('search_results.html', html);
    console.log('Search results HTML saved to search_results.html');

  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    // Save network logs
    fs.writeFileSync('network_logs.json', JSON.stringify(networkLogs, null, 2));
    console.log('Network logs saved to network_logs.json');
    
    await browser.close();
    console.log('Browser closed.');
  }
})();
