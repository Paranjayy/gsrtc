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
  const pnrData = await fetchInsecure('https://live.gsrtc.org/api/pnr', { pnrNo: 'g227072241' });
  console.log('PNR Data:', JSON.stringify(pnrData, null, 2));

  if (pnrData.status === 'success' && pnrData.result && pnrData.result.length > 0) {
    const vehicleNo = pnrData.result[0].VEHICLE_NO;
    console.log('Extracted Vehicle No:', vehicleNo);
    
    const cleaned = vehicleNo.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const today = new Date().toISOString().split('T')[0];

    const liveData = await fetchInsecure('https://live.gsrtc.org/api/vehicle/live', { vehicleNo: cleaned, scheduleDate: today });
    console.log('Live Data:', JSON.stringify(liveData, null, 2));

    const tooltipData = await fetchInsecure('https://live.gsrtc.org/api/vehicle/tooltip', { vehicleNo: cleaned });
    console.log('Tooltip Data:', JSON.stringify(tooltipData, null, 2));
  }
}

run();
