const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'after_click.html');
const html = fs.readFileSync(filePath, 'utf8');

// Find select elements
const selectRegex = /<select[^>]+(?:name|id)="([^"]*)"[^>]*>([\s\S]*?)<\/select>/gi;
let match;
while ((match = selectRegex.exec(html)) !== null) {
  console.log(`Select Name/Id: ${match[1]}`);
  // Parse options
  const optRegex = /<option[^>]+value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/gi;
  let optMatch;
  let count = 0;
  while ((optMatch = optRegex.exec(match[2])) !== null && count < 10) {
    console.log(`  Option Value: "${optMatch[1]}", Text: "${optMatch[2].trim()}"`);
    count++;
  }
}
