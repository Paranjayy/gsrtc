const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../automation/search_results.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const regex = /<li[^>]*class="[^"]*row-sec[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
const match = regex.exec(html);

if (match) {
  const rowHtml = match[0];
  
  // Find price or fare in the row
  console.log('--- Price / Fare section ---');
  const fareIndex = rowHtml.indexOf('₹');
  if (fareIndex !== -1) {
    console.log(rowHtml.substring(fareIndex - 100, fareIndex + 200));
  } else {
    console.log('No ₹ symbol found.');
    // Try "Fare" text
    const fareTextIndex = rowHtml.indexOf('Fare');
    if (fareTextIndex !== -1) {
      console.log(rowHtml.substring(fareTextIndex - 50, fareTextIndex + 200));
    }
  }

  // Find Select Seat button or inputs
  console.log('\n--- Select Seat/s section ---');
  const btnIndex = rowHtml.indexOf('Select Seat/s');
  if (btnIndex !== -1) {
    console.log(rowHtml.substring(btnIndex - 300, btnIndex + 200));
  }

  const radIndex = rowHtml.indexOf('radOnwardServiceID');
  if (radIndex !== -1) {
    console.log('\n--- radOnwardServiceID attribute found ---');
    console.log(rowHtml.substring(radIndex - 50, radIndex + 300));
  }
}
