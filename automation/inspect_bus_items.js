const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const filePath = 'file:///' + path.resolve('automation/search_results.html').replace(/\\/g, '/');
  console.log(`Opening: ${filePath}`);
  await page.goto(filePath);
  
  const busItems = await page.evaluate(() => {
    // Find all rows of buses
    // The items have class "bus-item" or are list items inside a container
    const items = Array.from(document.querySelectorAll('.bus-item, .row-sec'));
    return items.map((item, index) => ({
      index,
      className: item.className,
      id: item.id,
      outerHTML: item.outerHTML.substring(0, 1000) // first 1000 chars of each row
    }));
  });
  
  console.log(`Found ${busItems.length} bus items.`);
  if (busItems.length > 0) {
    console.log('Sample Bus Item HTML (Row 0):\n', busItems[0].outerHTML);
    console.log('\nSample Bus Item HTML (Row 1):\n', busItems[1]?.outerHTML);
  }
  
  await browser.close();
})();
