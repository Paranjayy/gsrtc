import { NextResponse } from 'next/server';
import https from 'https';

const insecureAgent = new https.Agent({ rejectUnauthorized: false });

function fetchInsecure(url: string, body: any): Promise<any> {
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let bodyStr = '';
      res.on('data', (chunk) => { bodyStr += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(bodyStr));
          } catch (e) {
            reject(new Error('Failed to parse JSON response'));
          }
        } else {
          reject(new Error(`API returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regNo = searchParams.get('regNo') || '';

  if (!regNo.trim()) {
    return NextResponse.json({ error: 'Registration number is required' }, { status: 400 });
  }

  // Clean registration number (remove spaces and hyphens, uppercase)
  let cleanedRegNo = regNo.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const today = new Date().toISOString().split('T')[0];
  let pnrConductorNumber = 'N/A';

  try {
    // Check if the input is a PNR number (Starts with G or g, followed only by digits)
    if (/^G\d+$/.test(cleanedRegNo)) {
      const pnrData = await fetchInsecure('https://live.gsrtc.org/api/pnr', { pnrNo: cleanedRegNo });
      
      if (pnrData.status === 'success' && pnrData.result && pnrData.result.length > 0) {
        const tripDetails = pnrData.result[0];
        // Extract the actual vehicle number and clean it
        if (tripDetails.VEHICLE_NO) {
          cleanedRegNo = tripDetails.VEHICLE_NO.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        }
        if (tripDetails.CONDUCTOR_MOBILE_NO) {
          pnrConductorNumber = tripDetails.CONDUCTOR_MOBILE_NO;
        }
      } else {
        return NextResponse.json({ error: 'Invalid PNR Number or trip not found' }, { status: 404 });
      }
    }

    // 1. Fetch live coordinates/status
    const liveData = await fetchInsecure('https://live.gsrtc.org/api/vehicle/live', {
      vehicleNo: cleanedRegNo,
      scheduleDate: today
    });

    // 2. Fetch tooltip/metadata details
    const tooltipData = await fetchInsecure('https://live.gsrtc.org/api/vehicle/tooltip', {
      vehicleNo: cleanedRegNo
    });

    // Merge coordinates and tooltip info
    const locationInfo = Array.isArray(liveData) ? liveData[0] : null;

    const result = {
      regNo: tooltipData.vehicleNo || regNo,
      busNo: tooltipData.busNo || 'N/A',
      latitude: tooltipData.latitude || locationInfo?.latitude || null,
      longitude: tooltipData.longitude || locationInfo?.longitude || null,
      location: tooltipData.location || 'Gujarat, India',
      speed: tooltipData.speed || '0',
      direction: tooltipData.direction || 'N/A',
      ignition: tooltipData.ignition || 'OFF',
      routeName: tooltipData.routeName || locationInfo?.routeName || 'N/A',
      routeId: tooltipData.routeId || 'N/A',
      serviceType: tooltipData.serviceType || 'N/A',
      depotName: tooltipData.depotName || 'N/A',
      conductorName: tooltipData.conductorName || 'N/A',
      conductorNumber: pnrConductorNumber !== 'N/A' ? pnrConductorNumber : (tooltipData.conductorNumber || 'N/A'),
      makerName: tooltipData.makerName || 'N/A',
      receivedDate: tooltipData.receivedDate || locationInfo?.lastArrivalDateTime || 'N/A',
      lastStation: locationInfo?.lastBusStation || 'N/A',
      nextLocation: locationInfo?.nextLocation || 'N/A',
      eta: locationInfo?.eta || 'N/A',
      status: locationInfo?.status || (tooltipData.ignition === 'ON' ? 'OnTrip' : 'N/A')
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error proxying vehicle tracking:', error.message);
    return NextResponse.json({ error: 'Failed to fetch live vehicle data from GSRTC servers.' }, { status: 500 });
  }
}
