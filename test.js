process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testFetch() {
  try {
    const res = await fetch('https://live.gsrtc.org/api/vehicle/tooltip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({ vehicleNo: 'GJ18ZT0206' })
    });
    console.log('Status:', res.status);
    const data = await res.text();
    console.log('Data:', data.substring(0, 100));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testFetch();
