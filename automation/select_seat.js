const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 }
  });
  const page = await context.newPage();

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
    await page.waitForTimeout(2000);

    // Close popup
    await page.click('#popup-close');
    await page.waitForTimeout(1000);

    // Fill Origin: JUNAGADH
    await page.fill('#matchStartPlaceA', 'JUNAGADH');
    await page.waitForSelector('.ui-menu-item');
    await page.click('.ui-menu-item:has-text("JUNAGADH")');

    // Fill Destination: DHORAJI
    await page.fill('#matchEndPlaceA', 'DHORAJI');
    await page.waitForTimeout(1000);
    await page.click('.ui-menu-item:has-text("DHORAJI")');

    // Date: next week
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const day = String(nextWeek.getDate()).padStart(2, '0');
    const month = String(nextWeek.getMonth() + 1).padStart(2, '0');
    const year = nextWeek.getFullYear();
    const dateString = `${day}-${month}-${year}`;
    
    console.log(`Setting date to ${dateString}...`);
    await page.evaluate((ds) => {
      const el = document.getElementById('datepickerOA');
      if (el) {
        el.removeAttribute('readonly');
        el.value = ds;
        el.dispatchEvent(new Event('change'));
      }
    }, dateString);
    await page.waitForTimeout(1000);

    // Search
    console.log('Searching buses...');
    await page.click('button.btn-search');
    await page.waitForTimeout(8000);

    console.log('Search completed. Finding available buses...');
    
    // Find all bus seat buttons
    // The buttons have text like 'Select Seat/s' and are NOT 'Full'
    // Let's print the text of all buttons to see which ones are available
    const buttonsInfo = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('a, button, div, span'));
      return btns
        .filter(btn => btn.innerText && btn.innerText.includes('Select Seat/s'))
        .map((btn, index) => ({
          index,
          text: btn.innerText.trim(),
          tagName: btn.tagName,
          className: btn.className,
          id: btn.id
        }));
    });
    console.log('Available Seat buttons found:', JSON.stringify(buttonsInfo, null, 2));

    if (buttonsInfo.length === 0) {
      console.log('No available buses found with seats.');
      await page.screenshot({ path: 'no_seats_found.png' });
      return;
    }

    // Click on the first select seat button
    console.log('Clicking the first Select Seat/s button...');
    
    // We can target the selector that matches the button. Let's find it.
    // In our evaluation, the class might be like a specific class or we can click by text
    // E.g., click the first element that has text 'Select Seat/s'
    const firstSeatBtn = page.locator('*:has-text("Select Seat/s")').last(); // Or let's use a more specific selector
    // Let's inspect the HTML of the first button
    // It's usually inside a container, let's click the element containing the text 'Select Seat/s'
    // Let's click the first button found
    await page.click('text="Select Seat/s"', { timeout: 5000 });
    
    console.log('Waiting for seat layout to load...');
    await page.waitForTimeout(5000);

    // Take screenshot of seat layout
    await page.screenshot({ path: 'seat_layout.png' });
    const seatHtml = await page.content();
    fs.writeFileSync('seat_layout.html', seatHtml);
    console.log('Saved seat_layout.png and seat_layout.html');

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    fs.writeFileSync('step2_network.json', JSON.stringify(networkLogs, null, 2));
    await browser.close();
  }
})();
