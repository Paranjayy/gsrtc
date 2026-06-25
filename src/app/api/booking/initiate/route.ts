import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      serviceInfo, jsessionid, 
      passengers, email, mobile,
      boardingPoint, droppingPoint,
      fareHint
    } = body;

    if (!serviceInfo || !jsessionid || !passengers || !passengers.length) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Cookie': `JSESSIONID=${jsessionid}`
    };

    // Step 1: Submit passenger details to lock seats
    const checkoutParams = new URLSearchParams();
    checkoutParams.append('Submit', 'passengerDetails');
    checkoutParams.append('txtHints' + serviceInfo.split(',')[0], fareHint || '0');
    
    passengers.forEach((p: any, i: number) => {
      checkoutParams.append(`passName${i}`, p.name);
      checkoutParams.append(`passAge${i}`, p.age.toString());
      checkoutParams.append(`selectGender${i}`, p.gender);
      checkoutParams.append(`selectConcession${i}`, '0');
      checkoutParams.append(`checkSeatNo${i}`, p.seatNo);
      checkoutParams.append(`checkSeatType${i}`, p.type || 'Seat');
      
      checkoutParams.append(`selectPickupPoint${i}`, boardingPoint || '');
      checkoutParams.append(`selectDropOffPoint${i}`, droppingPoint || '');
    });

    checkoutParams.append('mobileNo', mobile);
    checkoutParams.append('email', email);

    console.log("Submitting passenger details...", checkoutParams.toString());

    const checkoutRes = await fetch('https://gsrtc.in/OPRSOnline/advanceBooking.do?Submit=passengerDetails', {
      method: 'POST',
      headers,
      body: checkoutParams.toString()
    });

    if (!checkoutRes.ok) {
      throw new Error(`GSRTC passenger details submission failed with status ${checkoutRes.status}`);
    }

    // Step 2: Request the PG Redirect Form (ICICI)
    const iciciParams = new URLSearchParams();
    iciciParams.append('Submit', 'pgRequest');
    iciciParams.append('payMethod', 'ICICI');
    iciciParams.append('sendSms', 'WhatsApp');
    iciciParams.append('termsChk', 'on');

    console.log("Requesting PG redirect form...");

    const pgRes = await fetch('https://gsrtc.in/OPRSOnline/advanceBooking.do', {
      method: 'POST',
      headers,
      body: iciciParams.toString()
    });

    if (!pgRes.ok) {
      throw new Error(`GSRTC PG request failed with status ${pgRes.status}`);
    }

    const pgHtml = await pgRes.text();

    // The pgHtml should contain a form like <form name="ecom" method="post" action="https://eazypay.icicibank.com/...">
    // We will extract the form action and all hidden inputs
    const formRegex = /<form[^>]+action="([^"]+)"[^>]*>([\s\S]*?)<\/form>/i;
    const formMatch = pgHtml.match(formRegex);

    if (!formMatch) {
      console.log(pgHtml.substring(0, 500));
      return NextResponse.json({ error: 'Failed to extract payment gateway form from GSRTC response' }, { status: 500 });
    }

    const actionUrl = formMatch[1];
    const inputsHtml = formMatch[2];

    const inputRegex = /<input[^>]+type="hidden"[^>]+name="([^"]+)"[^>]+value="([^"]*)"[^>]*>/gi;
    const hiddenFields: Record<string, string> = {};
    
    let match;
    while ((match = inputRegex.exec(inputsHtml)) !== null) {
      hiddenFields[match[1]] = match[2];
    }

    // Return the action URL and fields so the frontend can auto-submit them
    return NextResponse.json({
      actionUrl,
      hiddenFields
    });

  } catch (error: any) {
    console.error('Error proxying checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
