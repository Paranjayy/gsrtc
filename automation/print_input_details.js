const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const filePath = 'file:///' + path.resolve('after_click.html').replace(/\\/g, '/');
  await page.goto(filePath);
  
  const visibleInputs = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
    return inputs
      .filter(el => {
        const type = el.getAttribute('type') || '';
        return type !== 'hidden' && type !== 'submit' && type !== 'button';
      })
      .map(el => ({
        tagName: el.tagName,
        id: el.id,
        name: el.name,
        type: el.getAttribute('type'),
        placeholder: el.getAttribute('placeholder'),
        value: el.value,
        outerHTML: el.outerHTML
      }));
  });
  
  console.log('Visible Input Fields:', JSON.stringify(visibleInputs, null, 2));
  
  await browser.close();
})();
