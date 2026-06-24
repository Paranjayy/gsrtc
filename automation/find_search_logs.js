const fs = require('fs');
const path = require('path');

// Search files in automation folder for logs of SearchServiceForHome
const logFiles = ['booking_network_logs.json', 'network_logs.json', 'step1_network.json', 'step2_network.json'];

logFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    return;
  }
  console.log(`\n=== Analyzing ${file} ===`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const logs = JSON.parse(content);
    
    // Find requests containing SearchServiceForHome
    const searchReqs = logs.filter(log => {
      const isReq = log.type === 'request' || !log.type; // depending on structure
      const url = log.url || '';
      return url.includes('SearchServiceForHome');
    });
    
    console.log(`Found ${searchReqs.length} search requests.`);
    searchReqs.forEach((req, idx) => {
      console.log(`Request ${idx}:`);
      console.log(`  URL: ${req.url}`);
      console.log(`  Method: ${req.method}`);
      console.log(`  Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`  PostData:`, req.postData);
    });
  } catch (err) {
    console.error(`Error parsing ${file}: ${err.message}`);
  }
});
