const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const filePath = 'file:///' + path.resolve('after_click.html').replace(/\\/g, '/');
  console.log(`Opening: ${filePath}`);
  await page.goto(filePath);
  
  const formSelectors = await page.evaluate(() => {
    // Let's find inputs, textareas, selects
    const inputs = Array.from(document.querySelectorAll('input, select, button, a'));
    
    // Find input fields
    const inputFields = inputs
      .filter(el => el.id || el.name || el.className)
      .map(el => ({
        tagName: el.tagName,
        id: el.id,
        name: el.name,
        className: el.className,
        type: el.getAttribute('type'),
        placeholder: el.getAttribute('placeholder'),
        value: el.value,
        text: el.textContent ? el.textContent.trim().substring(0, 50) : ''
      }));
      
    // Find all images or elements representing seats
    // Often seats are images with specific src like "availableSeatnew.gif" or class "seat"
    const images = Array.from(document.querySelectorAll('img'));
    const seatImages = images
      .filter(img => img.src && (img.src.includes('Seat') || img.src.includes('seat')))
      .map(img => ({
        id: img.id,
        src: img.src.split('/').pop(),
        alt: img.getAttribute('alt'),
        onclick: img.getAttribute('onclick'),
        title: img.getAttribute('title')
      }));

    return {
      inputFields: inputFields.filter(f => f.tagName !== 'A' && f.tagName !== 'BUTTON'),
      buttons: inputFields.filter(f => f.tagName === 'BUTTON' || f.type === 'button' || f.type === 'submit' || f.text.includes('BOOK') || f.text.includes('Close')),
      seatImages: seatImages.slice(0, 15) // print first 15 seat images
    };
  });
  
  console.log('Form Input Fields:', JSON.stringify(formSelectors.inputFields, null, 2));
  console.log('Buttons:', JSON.stringify(formSelectors.buttons, null, 2));
  console.log('Seat Images (Sample):', JSON.stringify(formSelectors.seatImages, null, 2));
  
  await browser.close();
})();
