const fs = require('fs');

const logs = JSON.parse(fs.readFileSync('booking_network_logs.json', 'utf8'));

// Filter out Google Analytics and other third-party domains
const gsrtcLogs = logs.filter(log => log.url.includes('gsrtc.in') && !log.url.includes('google'));

console.log(`Total GSRTC Requests captured: ${gsrtcLogs.length}\n`);

gsrtcLogs.forEach((log, index) => {
  if (log.type === 'request') {
    console.log(`--- [REQ #${index}] ${log.method} ${log.url} ---`);
    if (log.postData) {
      console.log('Payload:');
      // Format URL-encoded payloads nicely for readability
      if (log.postData.includes('&')) {
        const params = new URLSearchParams(log.postData);
        for (const [key, value] of params.entries()) {
          console.log(`  ${key}: ${value}`);
        }
      } else {
        console.log(`  ${log.postData}`);
      }
    }
    console.log();
  } else if (log.type === 'response') {
    console.log(`--- [RES #${index}] Status: ${log.status} for ${log.url} ---`);
    if (log.body) {
      if (typeof log.body === 'object') {
        console.log('JSON Response:', JSON.stringify(log.body, null, 2));
      } else {
        // Print the first 300 characters of text/html response
        console.log('Text Response (Prefix):', log.body.substring(0, 300).replace(/\r?\n|\r/g, ' ').trim() + '...');
      }
    }
    console.log();
  }
});
