const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('request', request => {
    console.log(`[REQ] ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    console.log(`[RES] ${response.status()} ${response.url()}`);
  });

  try {
    console.log('Navigating to GSRTC...');
    await page.goto('https://gsrtc.in/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2000);

    console.log('Closing popup modal...');
    await page.click('#popup-close');
    await page.waitForTimeout(1000);

    // Origin
    await page.fill('#matchStartPlaceA', 'JUNAGADH');
    await page.waitForSelector('.ui-menu-item');
    await page.click('.ui-menu-item:has-text("JUNAGADH")');

    // Destination
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

    // Take screenshot before click
    await page.screenshot({ path: 'before_click.png' });

    // Click selectButton0
    console.log('Clicking #selectButton0...');
    await page.click('#selectButton0');
    
    console.log('Waiting for seat layout to load...');
    await page.waitForTimeout(6000);

    // Screenshot after click
    await page.screenshot({ path: 'after_click.png' });
    
    // Save content
    const html = await page.content();
    fs.writeFileSync('after_click.html', html);
    console.log('Saved before_click.png, after_click.png and after_click.html');

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
  }
})();
