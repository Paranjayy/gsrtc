const https = require('https');

const insecureAgent = new https.Agent({ rejectUnauthorized: false });

function fetchInsecure(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      agent: insecureAgent,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let bodyStr = '';
      res.on('data', (chunk) => { bodyStr += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(bodyStr));
        } catch (e) {
          resolve(bodyStr);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

async function run() {
  const regNo = 'GJ18ZT0304';
  
  console.log('Fetching Tooltip Data...');
  const tooltip = await fetchInsecure('https://live.gsrtc.org/api/tooltip', { vehicleNo: regNo });
  console.log('Tooltip JSON:', JSON.stringify(tooltip, null, 2));

  console.log('\nFetching Live Data...');
  const live = await fetchInsecure('https://live.gsrtc.org/api/vehicle/live', { vehicleNo: regNo });
  console.log('Live JSON:', JSON.stringify(live, null, 2));
}

run();
