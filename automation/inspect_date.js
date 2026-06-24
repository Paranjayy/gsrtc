const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://gsrtc.in/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.click('#popup-close');
  await page.waitForTimeout(1000);
  
  // Click date picker to open calendar
  await page.click('#datepickerOA');
  await page.waitForTimeout(1500);
  
  const datepickerInfo = await page.evaluate(() => {
    const input = document.getElementById('datepickerOA');
    const inputHtml = input ? input.outerHTML : 'input not found';
    
    // jQuery UI Datepicker usually creates an element with ID ui-datepicker-div
    const calendar = document.getElementById('ui-datepicker-div');
    const calendarHtml = calendar ? calendar.outerHTML : 'calendar not found';
    
    return {
      inputHtml,
      calendarHtml
    };
  });
  
  console.log('Input HTML:', datepickerInfo.inputHtml);
  console.log('Calendar HTML:', datepickerInfo.calendarHtml);
  
  await browser.close();
})();
