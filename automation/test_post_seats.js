async function testSeats() {
  const serviceInfo = "48279,41,VOLVO,202,0,07:11,06:00,GEETAMANDIR BUS PORT,AHMEDABAD GITA MANDIR BUS PORT,SOMNATH,0546ABDSMNTVL47,Y";
  
  const postParams = new URLSearchParams();
  postParams.append('radOnwardServiceID', serviceInfo);
  postParams.append('slNo', '0');

  console.log('Sending seat layout request to GSRTC...');
  try {
    const res = await globalThis.fetch('https://gsrtc.in/OPRSOnline/advanceBooking.do?hiddenAction=SubmitToGetAjaxSeatLayout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      body: postParams.toString()
    });

    console.log(`Response Status: ${res.status}`);
    const text = await res.text();
    console.log('Response length:', text.length);
    console.log('Response Snippet (1000 chars):', text.substring(0, 1000));
    
    // Find comments Col
    for (let i = 1; i <= 6; i++) {
      const startTag = `<!-- START_Col${i} -->`;
      const endTag = `<!-- END_Col${i} -->`;
      const startIdx = text.indexOf(startTag);
      const endIdx = text.indexOf(endTag);
      console.log(`Col ${i} tags found: Start: ${startIdx !== -1}, End: ${endIdx !== -1}`);
    }
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testSeats();
