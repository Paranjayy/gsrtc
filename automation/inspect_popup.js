const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://gsrtc.in/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  // Inspect popup related elements
  const popupInfo = await page.evaluate(() => {
    const overlay = document.getElementById('popup-overlay');
    const overlayHtml = overlay ? overlay.outerHTML : 'overlay not found';
    
    // Find all elements containing "Close" case-sensitively
    const elements = Array.from(document.querySelectorAll('*'));
    const closeElements = elements
      .filter(el => el.textContent && el.textContent.trim() === 'Close')
      .map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        outerHTML: el.outerHTML
      }));
      
    return {
      overlayHtml,
      closeElements
    };
  });
  
  console.log('Popup Info:', JSON.stringify(popupInfo, null, 2));
  
  await browser.close();
})();
