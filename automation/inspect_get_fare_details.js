const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://gsrtc.in/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.click('#popup-close');
    await page.waitForTimeout(1000);

    await page.fill('#matchStartPlaceA', 'JUNAGADH');
    await page.waitForSelector('.ui-menu-item');
    await page.click('.ui-menu-item:has-text("JUNAGADH")');

    await page.fill('#matchEndPlaceA', 'DHORAJI');
    await page.waitForTimeout(1000);
    await page.click('.ui-menu-item:has-text("DHORAJI")');

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const day = String(nextWeek.getDate()).padStart(2, '0');
    const month = String(nextWeek.getMonth() + 1).padStart(2, '0');
    const year = nextWeek.getFullYear();
    const dateString = `${day}-${month}-${year}`;
    
    await page.evaluate((ds) => {
      const el = document.getElementById('datepickerOA');
      if (el) {
        el.removeAttribute('readonly');
        el.value = ds;
        el.dispatchEvent(new Event('change'));
      }
    }, dateString);
    await page.waitForTimeout(1000);

    await page.click('button.btn-search');
    await page.waitForTimeout(8000);

    await page.click('#selectButton0');
    await page.waitForTimeout(5000);

    const functionSource = await page.evaluate(() => {
      return typeof GetFareDetails !== 'undefined' ? GetFareDetails.toString() : 'GetFareDetails not defined';
    });

    console.log('GetFareDetails Source Code on Live Site:\n', functionSource);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
