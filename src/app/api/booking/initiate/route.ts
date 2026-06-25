import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      serviceInfo, jsessionid, seatNo, passengerDetails, 
      boardingPoint, droppingPoint, payMethod = 'ICICI', sendSms = 'WhatsApp'
    } = body;

    if (!serviceInfo || !jsessionid || !seatNo || !passengerDetails) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const bookParams = new URLSearchParams();
    bookParams.append('Submit', 'passengerDetails');
    bookParams.append('radOnwardServiceID', serviceInfo);
    bookParams.append('forwardid', seatNo);
    
    // We only support 1 passenger for this MVP, but passengerDetails.passengers is an array
    const passenger = passengerDetails.passengers[0];
    bookParams.append('passengerName', passenger.name);
    bookParams.append('passengerAge', passenger.age.toString());
    bookParams.append('passengerGender', passenger.gender);
    bookParams.append('passengerConcession', '14'); // General Public ID
    bookParams.append('concessions', '0.0');
    
    bookParams.append('boardingPoint', boardingPoint || '43,00:00,null');
    bookParams.append('droppingPoint', droppingPoint || '81,00:00,null');
    bookParams.append('mobileNo', passengerDetails.mobile);
    bookParams.append('email', passengerDetails.email);
    bookParams.append('agreePolicy', 'on');
    bookParams.append('payMethod', payMethod);
    bookParams.append('sendSms', sendSms);

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Cookie': `JSESSIONID=${jsessionid}`
    };

    const res = await fetch('https://gsrtc.in/OPRSOnline/advanceBooking.do', {
      method: 'POST',
      headers,
      body: bookParams.toString()
    });

    if (!res.ok) {
      throw new Error(`GSRTC advanceBooking.do returned status ${res.status}`);
    }

    const htmlText = await res.text();
    
    // Extract PG URL and hidden form fields
    const formRegex = /<form[^>]*action="([^"]+)"[^>]*name="frmPayment"[^>]*>([\s\S]*?)<\/form>/i;
    const formMatch = htmlText.match(formRegex);
    
    if (!formMatch) {
      return NextResponse.json({ error: 'Failed to extract payment form from GSRTC response' }, { status: 500 });
    }
    
    const actionUrl = formMatch[1];
    const formInputsHtml = formMatch[2];
    
    const inputRegex = /<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"[^>]*>/gi;
    const hiddenFields: Record<string, string> = {};
    let match;
    while ((match = inputRegex.exec(formInputsHtml)) !== null) {
      hiddenFields[match[1]] = match[2];
    }

    return NextResponse.json({
      actionUrl,
      hiddenFields
    });
  } catch (error: any) {
    console.error('Error initiating booking:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
