import { NextResponse } from 'next/server';

function parseBusHTML(htmlContent: string) {
  const buses: any[] = [];
  const rowRegex = /<li[^>]*class="[^"]*row-sec[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  
  while ((match = rowRegex.exec(htmlContent)) !== null) {
    const rowHtml = match[0];
    
    // Extract Trip Code
    const codeMatch = rowHtml.match(/class="lh-24 f-bold d-color">([^<]+)<\/div>/i);
    const tripCode = codeMatch ? codeMatch[1].trim() : '';
    
    // Extract Departure Time
    const timeSecMatch = rowHtml.match(/id="DeptTime"[\s\S]*?<div class=" lh-24  l-color">([^<]+)<\/div>/i);
    const departureTime = timeSecMatch ? timeSecMatch[1].trim() : '';

    // Extract Origin and Destination Names
    const originMatch = rowHtml.match(/id="service_Start_PointM"[\s\S]*?<div class="dur l-color lh-24">(?:<font[^>]*>)?([^<]+?)(?:<\/font>)?<\/div>/i);
    const destMatch = rowHtml.match(/id="destinationM"[\s\S]*?<div class="dur l-color lh-24">(?:<font[^>]*>)?([^<]+?)(?:<\/font>)?<\/div>/i);
    const origin = originMatch ? originMatch[1].trim() : '';
    const destination = destMatch ? destMatch[1].trim() : '';

    // Extract Duration
    const durationMatch = rowHtml.match(/id="durationM"[\s\S]*?<div class="fare d-block">([^<]+)<\/div>/i);
    let duration = durationMatch ? durationMatch[1].trim() : '';

    // Extract Fare
    const fareMatch = rowHtml.match(/class="WebRupee"[^>]*>(?:&#x20B9;|₹|Rs\.?|INR|<[^>]+>)*\s*([\d.,]+)/i) || rowHtml.match(/class="fare[^"]*"[^>]*>(?:&#x20B9;|₹|Rs\.?|INR|<[^>]+>)*\s*([\d.,]+)/i);
    const fare = fareMatch ? parseFloat(fareMatch[1].replace(/,/g, '').trim()) : 0;

    // Extract Seat Info and Service ID
    const layoutMatch = rowHtml.match(/showLayOut\('([^']+)',\s*'([^']*)',\s*'([^']*)'\)/i);
    let serviceId = '';
    let serviceInfo = '';
    let availableSeats = 0;
    let className = 'EXPRESS';
    let isFull = false;

    if (layoutMatch) {
      serviceInfo = layoutMatch[1];
      const parts = serviceInfo.split(',');
      serviceId = parts[0] || '';
      className = parts[2] || 'EXPRESS';
      availableSeats = parseInt(layoutMatch[3]) || 0;
      if (!duration && parts[5]) duration = parts[5];
    } else {
      const fullMatch = rowHtml.match(/class="buttonClose"[^>]*><span>Full<\/span>/i) || rowHtml.includes('Full');
      if (fullMatch) {
        isFull = true;
        availableSeats = 0;
        if (tripCode.includes('AC')) {
          className = 'AC LUXURY';
        } else if (tripCode.includes('LUXRY')) {
          className = 'LUXURY';
        } else {
          className = 'EXPRESS';
        }
      }
    }

    if (tripCode) {
      buses.push({
        serviceId: serviceId || `full-${tripCode}`,
        tripCode,
        className,
        origin,
        destination,
        departureTime,
        duration,
        fare,
        availableSeats,
        isFull,
        serviceInfo
      });
    }
  }
  return buses;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const originName = searchParams.get('originName') || '';
    const originId = searchParams.get('originId') || '';
    const originCode = searchParams.get('originCode') || '';
    const destName = searchParams.get('destName') || '';
    const destId = searchParams.get('destId') || '';
    const destCode = searchParams.get('destCode') || '';
    const date = searchParams.get('date') || '';
    const passengers = searchParams.get('passengers') || '1';

    if (!originId || !destId || !date) {
      return NextResponse.json({ error: 'Missing required search parameters' }, { status: 400 });
    }

    // Get current date in Indian style DD/MM/YYYY
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const currentDate = `${day}/${month}/${year}`;

    const bodyParams = new URLSearchParams();
    bodyParams.append('matchStartPlaceA', originName);
    bodyParams.append('matchEndPlaceA', destName);
    bodyParams.append('matchStartPlaceB', '');
    bodyParams.append('matchEndPlaceB', '');
    bodyParams.append('matchStartPlaceC', '');
    bodyParams.append('matchEndPlaceC', '');
    bodyParams.append('matchStartPlaceD', '');
    bodyParams.append('matchEndPlaceD', 'STATUE OF UNITY(NAVAGAM)');
    bodyParams.append('matchStartPlaceE', '');
    bodyParams.append('matchEndPlaceE', '');
    bodyParams.append('matchStartPlaceF', '');
    bodyParams.append('matchEndPlaceF', '');
    bodyParams.append('selectStartPlace', '');
    bodyParams.append('selectEndPlace', '');
    bodyParams.append('hiddenStartPlaceName', originName);
    bodyParams.append('hiddenEndPlaceName', destName);
    bodyParams.append('hiddenStartPlaceID', originId);
    bodyParams.append('hiddenEndPlaceID', destId);
    bodyParams.append('txtStartPlaceCode', originCode);
    bodyParams.append('txtEndPlaceCode', destCode);
    bodyParams.append('txtJourneyDate', date);
    bodyParams.append('txtReturnDate', '');
    bodyParams.append('hiddenOnwardJourneyDate', date);
    bodyParams.append('hiddenReturnJourneyDate', '');
    bodyParams.append('hiddenCurrentDate', currentDate);
    bodyParams.append('hiddenMaxValidReservDate', '');
    bodyParams.append('hiddenMaxNoOfPassengers', '');
    bodyParams.append('hiddenTotalMales', '');
    bodyParams.append('hiddenTotalFemales', '');
    bodyParams.append('txtOnwardFromTime', '');
    bodyParams.append('txtOnwardToTime', '');
    bodyParams.append('hiddenAction', 'SearchServiceForHomeA');
    bodyParams.append('hiddenNoOfPassengers', '');
    bodyParams.append('selectNoOfPassengers', passengers);
    bodyParams.append('hiddenJourneyType', 'O');
    bodyParams.append('singleLady', 'N');
    bodyParams.append('singleLadyA/', '');
    bodyParams.append('hiddenSeatError', 'NOERROR');
    bodyParams.append('selectClass', '');
    bodyParams.append('selectOnwardTimeSlab', '');
    bodyParams.append('hiddenOnwardTimeSlab', '');
    bodyParams.append('hiddenLanguage', 'English');
    bodyParams.append('premiumMatchStartPlace', '');
    bodyParams.append('premiumMatchEndPlace', '');
    bodyParams.append('premiumDatepickerO', '');
    bodyParams.append('premiumDatepickerR', '');
    bodyParams.append('premiumSelectNoOfPassengersO', '');
    bodyParams.append('hiddenSOU', '');
    bodyParams.append('selectNoOfPassengersO', '');
    bodyParams.append('datepickerOA', '');

    const res = await fetch('https://gsrtc.in/OPRSOnline/jqreq.do?hiddenAction=SearchServiceForHome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      },
      body: bodyParams.toString()
    });

    if (!res.ok) {
      throw new Error(`GSRTC search servlet returned status ${res.status}`);
    }

    const htmlContent = await res.text();
    const buses = parseBusHTML(htmlContent);

    const cookieHeader = res.headers.get('set-cookie');
    const match = cookieHeader?.match(/JSESSIONID=([^;]+)/);
    const jsessionid = match ? match[1] : '';

    return NextResponse.json({ buses, jsessionid });
  } catch (error: any) {
    console.error('Error proxying GSRTC search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
