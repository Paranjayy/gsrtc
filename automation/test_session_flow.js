async function testSessionFlow() {
  const originName = 'AHMEDABAD NEHRUNAGAR';
  const originId = '275';
  const originCode = 'NHRNR';
  const destName = 'JUNAGADH';
  const destId = '57';
  const destCode = 'JND';
  const date = '01/07/2026';
  const passengers = '1';
  const currentDate = '24/06/2026';

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

  console.log('1. Querying search...');
  const searchRes = await globalThis.fetch('https://gsrtc.in/OPRSOnline/jqreq.do?hiddenAction=SearchServiceForHome', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    body: bodyParams.toString()
  });

  const cookieHeader = searchRes.headers.get('set-cookie');
  console.log('Set-Cookie Header:', cookieHeader);
  const match = cookieHeader?.match(/JSESSIONID=([^;]+)/);
  const jsessionid = match ? match[1] : '';
  console.log('Extracted JSESSIONID:', jsessionid);

  const searchHtml = await searchRes.text();
  
  // Find a serviceInfo from search results
  // showLayOut('47934,21,AC LUXURY,204,0,00:45,06:00,JUNAGADH,JUNAGADH,JAMNAGAR,0600JNDJMNAC45,Y','0', '37')
  const layoutMatch = searchHtml.match(/showLayOut\('([^']+)',\s*'([^']*)',\s*'([^']*)'\)/i);
  if (!layoutMatch) {
    console.log('Could not find any available bus showLayOut match!');
    return;
  }
  const serviceInfo = layoutMatch[1];
  console.log('Selected serviceInfo:', serviceInfo);

  // 2. Querying Seat Layout forwarding the cookie!
  const seatParams = new URLSearchParams();
  seatParams.append('radOnwardServiceID', serviceInfo);
  seatParams.append('slNo', '0');

  console.log('\n2. Querying seat layout with JSESSIONID cookie...');
  const seatRes = await globalThis.fetch('https://gsrtc.in/OPRSOnline/advanceBooking.do?hiddenAction=SubmitToGetAjaxSeatLayout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Cookie': `JSESSIONID=${jsessionid}` // Forwarding cookie!
    },
    body: seatParams.toString()
  });

  console.log(`Seat Layout Response Status: ${seatRes.status}`);
  const seatHtml = await seatRes.text();
  console.log('Seat Layout HTML length:', seatHtml.length);
  
  // Check if errorMessageTxt exists (which indicates failure)
  if (seatHtml.includes('errorMessageTxt') || seatHtml.includes('Sorry..')) {
    console.log('FAIL: Error message found in seat HTML snippet!');
    console.log(seatHtml.substring(seatHtml.indexOf('Sorry..') - 50, seatHtml.indexOf('Sorry..') + 150));
  } else {
    console.log('SUCCESS! No error message found.');
    // Check columns
    for (let i = 1; i <= 6; i++) {
      const startTag = `<!-- START_Col${i} -->`;
      const endTag = `<!-- END_Col${i} -->`;
      const startIdx = seatHtml.indexOf(startTag);
      const endIdx = seatHtml.indexOf(endTag);
      console.log(`Col ${i} tags found: Start: ${startIdx !== -1}, End: ${endIdx !== -1}`);
    }
  }
}

testSessionFlow();
