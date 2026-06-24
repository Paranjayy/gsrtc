const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const filePath = 'file:///' + path.resolve('search_results.html').replace(/\\/g, '/');
  console.log(`Opening: ${filePath}`);
  await page.goto(filePath);
  
  const seatButtons = await page.evaluate(() => {
    // Find all elements containing "Select Seat/s" or "Seat"
    const elements = Array.from(document.querySelectorAll('*'));
    return elements
      .filter(el => el.textContent && el.textContent.includes('Select Seat'))
      .map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        text: el.textContent.trim().substring(0, 100),
        onClick: el.getAttribute('onclick') || el.getAttribute('href')
      }))
      .filter(info => info.tagName === 'A' || info.tagName === 'BUTTON' || info.id || info.onClick);
  });
  
  console.log('Found seat selection elements:', JSON.stringify(seatButtons, null, 2));
  
  await browser.close();
})();
