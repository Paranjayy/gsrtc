const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const filePath = 'file:///' + path.resolve('after_click.html').replace(/\\/g, '/');
  await page.goto(filePath);
  
  const buttonDetails = await page.evaluate(() => {
    // Find all links containing BOOK
    const anchors = Array.from(document.querySelectorAll('a'));
    const bookAnchors = anchors.filter(a => a.textContent && a.textContent.includes('BOOK'));
    
    return bookAnchors.map(a => ({
      tagName: a.tagName,
      className: a.className,
      id: a.id,
      href: a.getAttribute('href'),
      onclick: a.getAttribute('onclick'),
      outerHTML: a.outerHTML,
      parentHTML: a.parentElement ? a.parentElement.outerHTML.substring(0, 500) : ''
    }));
  });
  
  console.log('Book Button Details:', JSON.stringify(buttonDetails, null, 2));
  
  await browser.close();
})();
