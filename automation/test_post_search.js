async function testSearch() {
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
  bodyParams.append('hiddenAction', 'SearchServiceForHomeA'); // Crucial!
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

  console.log('Sending search request to GSRTC...');
  try {
    const res = await globalThis.fetch('https://gsrtc.in/OPRSOnline/jqreq.do?hiddenAction=SearchServiceForHome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      },
      body: bodyParams.toString()
    });

    console.log(`Response Status: ${res.status}`);
    console.log('Response Headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
    
    const text = await res.text();
    console.log('Response text length:', text.length);
    console.log('Response text snippet:', text.substring(0, 1000));
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testSearch();
