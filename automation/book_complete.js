const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 }
  });
  const page = await context.newPage();

  // Listen for browser dialogs (alerts, confirms)
  page.on('dialog', async dialog => {
    console.log(`[DIALOG ALERT] Message: "${dialog.message()}" (Type: ${dialog.type()})`);
    await dialog.accept();
  });

  // Listen to network requests/responses
  const networkLogs = [];
  page.on('request', request => {
    const url = request.url();
    const method = request.method();
    if (url.includes('gsrtc.in') && (method === 'POST' || url.includes('/api/') || url.includes('/services/') || url.includes('Booking') || url.includes('booking') || url.includes('.do'))) {
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
    if (url.includes('gsrtc.in') && (method === 'POST' || url.includes('/api/') || url.includes('/services/') || url.includes('Booking') || url.includes('booking') || url.includes('.do'))) {
      let body = null;
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('json')) {
          body = await response.json();
        } else if (contentType.includes('text') || contentType.includes('javascript') || contentType.includes('xml')) {
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

    console.log('Closing popup modal...');
    await page.click('#popup-close');
    await page.waitForTimeout(1000);

    // Fill Origin: JUNAGADH
    console.log('Entering origin...');
    await page.fill('#matchStartPlaceA', 'JUNAGADH');
    await page.waitForSelector('.ui-menu-item');
    await page.click('.ui-menu-item:has-text("JUNAGADH")');

    // Fill Destination: DHORAJI
    console.log('Entering destination...');
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

    // Click search
    console.log('Searching buses...');
    await page.click('button.btn-search');
    await page.waitForTimeout(8000);

    // Click selectButton0 (First available bus)
    console.log('Clicking the seat layout button...');
    await page.click('#selectButton0');
    await page.waitForTimeout(5000);

    // Click first available seat
    console.log('Clicking the first available seat...');
    const availableSeat = page.locator('img[src*="availableSeatnew.gif"]').first();
    await availableSeat.click();
    await page.waitForTimeout(2000);

    // Fill passenger details (use a realistic mobile number to bypass validation checks)
    console.log('Entering passenger details...');
    await page.fill('#txtEmailID0', 'DUMMYEMAIL@GMAIL.COM');
    await page.fill('#txtMobileNo0', '9924513876');
    await page.fill('#txtNameArray0', 'JOHN DOE');
    await page.fill('#txtAgeArray0', '30');
    await page.selectOption('#selectGenderArray0', 'M');

    // Save screenshot before booking
    await page.screenshot({ path: 'before_book.png' });
    console.log('Saved before_book.png');

    // Click BOOK button
    console.log('Clicking BOOK...');
    const bookBtn = page.locator('a.button:has-text("BOOK")').first();
    await bookBtn.click();

    // Wait a bit for payment redirect or confirmation modal
    console.log('Waiting post-booking actions...');
    await page.waitForTimeout(8000);

    // Save screenshot after booking
    await page.screenshot({ path: 'after_book.png' });
    console.log('Saved after_book.png');
    
    const postBookHtml = await page.content();
    fs.writeFileSync('after_book.html', postBookHtml);

  } catch (err) {
    console.error('Error during booking flow:', err);
  } finally {
    fs.writeFileSync('booking_network_logs.json', JSON.stringify(networkLogs, null, 2));
    await browser.close();
    console.log('Flow complete.');
  }
})();
