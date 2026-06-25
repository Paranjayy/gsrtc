import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceInfo = searchParams.get('serviceInfo');
    const jsessionid = searchParams.get('jsessionid');

    if (!serviceInfo) {
      return NextResponse.json({ error: 'Missing serviceInfo parameter' }, { status: 400 });
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*'
    };

    if (jsessionid) {
      headers['Cookie'] = `JSESSIONID=${jsessionid}`;
    }

    const res = await fetch(`https://gsrtc.in/OPRSOnline/advanceBooking.do?Submit=fareSummary&ServiceID=${encodeURIComponent(serviceInfo)}`, {
      method: 'GET',
      headers
    });

    if (!res.ok) {
      throw new Error(`GSRTC fare summary servlet returned status ${res.status}`);
    }

    const text = await res.text();
    // Example: "117.00#5.00#0.00#0.00#0.00#0.00#0.00#0.00#0.00#1.00#121.00#null#null"
    const arr = text.split('#');

    // Make sure we got valid data
    if (arr.length >= 11) {
      const breakdown = {
        basicFare: parseFloat(arr[0]) || 0,
        resFee: parseFloat(arr[1]) || 0,
        accFee: parseFloat(arr[2]) || 0,
        tollFee: parseFloat(arr[3]) || 0,
        tollFeeR: parseFloat(arr[4]) || 0,
        serviceCharge: parseFloat(arr[5]) || 0,
        otherLevies: parseFloat(arr[6]) || 0,
        gst: parseFloat(arr[7]) || 0,
        concessions: parseFloat(arr[8]) || 0,
        discount: parseFloat(arr[9]) || 0,
        totalAmount: parseFloat(arr[10]) || 0
      };
      return NextResponse.json(breakdown);
    }

    return NextResponse.json({ error: 'Invalid response format' }, { status: 500 });
  } catch (error: any) {
    console.error('Error proxying fare summary:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
