const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  // Listen to network requests/responses
  const networkLogs = [];
  page.on('request', request => {
    const url = request.url();
    const method = request.method();
    if (url.includes('gsrtc.in') && (method === 'POST' || url.includes('/api/') || url.includes('/services/'))) {
      networkLogs.push({
        type: 'request',
        timestamp: new Date().toISOString(),
        url,
        method,
        postData: request.postData()
      });
      console.log(`[REQ] ${method} ${url}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    const method = response.request().method();
    if (url.includes('gsrtc.in') && (method === 'POST' || url.includes('/api/') || url.includes('/services/'))) {
      let body = null;
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('json')) {
          body = await response.json();
        } else {
          body = await response.text();
        }
      } catch (err) {}
      networkLogs.push({
        type: 'response',
        timestamp: new Date().toISOString(),
        url,
        status: response.status(),
        body
      });
      console.log(`[RES] ${response.status()} ${url}`);
    }
  });

  try {
    console.log('Navigating to GSRTC...');
    await page.goto('https://gsrtc.in/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Close popup modal
    console.log('Closing popup modal...');
    await page.click('#popup-close');
    await page.waitForTimeout(1000);

    // Fill Origin: JUNAGADH
    console.log('Filling origin...');
    await page.fill('#matchStartPlaceA', 'JUNAGADH');
    await page.waitForSelector('.ui-menu-item');
    await page.click('.ui-menu-item:has-text("JUNAGADH")');

    // Fill Destination: DHORAJI
    console.log('Filling destination...');
    await page.fill('#matchEndPlaceA', 'DHORAJI');
    await page.waitForTimeout(1000); // wait for menu to load
    await page.click('.ui-menu-item:has-text("DHORAJI")');

    // Date: next week (7 days from today)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const day = String(nextWeek.getDate()).padStart(2, '0');
    const month = String(nextWeek.getMonth() + 1).padStart(2, '0');
    const year = nextWeek.getFullYear();
    const dateString = `${day}-${month}-${year}`;
    
    console.log(`Setting date to ${dateString} via JS...`);
    await page.evaluate((ds) => {
      const el = document.getElementById('datepickerOA');
      if (el) {
        el.removeAttribute('readonly');
        el.value = ds;
        el.dispatchEvent(new Event('focus'));
        el.dispatchEvent(new Event('input'));
        el.dispatchEvent(new Event('change'));
        el.dispatchEvent(new Event('blur'));
      }
    }, dateString);

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'search_form_filled.png' });

    // Click search button
    console.log('Clicking Search...');
    const searchBtn = page.locator('button.btn-search, input[value="Search"], button:has-text("Search")').first();
    await searchBtn.click();

    console.log('Waiting for search results...');
    await page.waitForTimeout(8000); // Wait for results to load

    // Screenshot and HTML of search results page
    await page.screenshot({ path: 'search_results.png' });
    const content = await page.content();
    fs.writeFileSync('search_results.html', content);
    console.log('Saved search_results.png and search_results.html');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    fs.writeFileSync('step1_network.json', JSON.stringify(networkLogs, null, 2));
    await browser.close();
  }
})();
