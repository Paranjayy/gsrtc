import { NextResponse } from 'next/server';

function parseSeatsHTML(htmlContent: string): any[] {
  const seats: any[] = [];
  
  // Find all columns Col1 to Col6
  for (let i = 1; i <= 6; i++) {
    const startTag = `<!-- START_Col${i} -->`;
    const endTag = `<!-- END_Col${i} -->`;
    const startIdx = htmlContent.indexOf(startTag);
    const endIdx = htmlContent.indexOf(endTag);
    
    if (startIdx !== -1 && endIdx !== -1) {
      const colBlock = htmlContent.substring(startIdx + startTag.length, endIdx);
      // Split the column block by cells
      const cells = colBlock.split(/<td[^>]*width="50"[^>]*>/gi);
      
      // cells[0] is the header part of the column, cells[1..12] are the rows
      cells.slice(1).forEach((cellHtml, rowIdx) => {
        const imgMatch = cellHtml.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
        if (imgMatch) {
          const src = imgMatch[1];
          const isBooked = src.includes('bookedSeatnew') || src.includes('Sleeper-Seat_Booked');
          const isLadies = src.includes('LadiesSeatnew') || src.includes('Sleeper-Seat_Ladies');
          const type = src.includes('Sleeper') ? 'Berth' : 'Seat';
          
          // Get seat label or title
          const labelMatch = cellHtml.match(/class="seatLayoutNoTxt"[^>]*>\s*([^<]+)\s*<\/div>/i);
          let seatNo = labelMatch ? labelMatch[1].replace(/&nbsp;/g, '').trim() : '';
          if (!seatNo) {
            const titleMatch = imgMatch[0].match(/title="([^"]+)"/i);
            seatNo = titleMatch ? titleMatch[1].trim() : '';
          }
          
          // Clean up seat number
          seatNo = seatNo.replace(/\s+/g, '');
          const rowcolMatch = cellHtml.match(/['"]([A-Z0-9]+-[A-Z]*\d+)['"]/i);
          const rowcol = rowcolMatch ? rowcolMatch[1] : '';
          
          if (seatNo) {
            seats.push({
              seatNo,
              isBooked,
              isLadies,
              type,
              rowcol,
              row: rowIdx,
              col: i
            });
          }
        }
      });
    }
  }
  
  return seats;
}

function parseSelectOptions(htmlContent: string, selectId: string): Array<{ label: string; value: string }> {
  const options: Array<{ label: string; value: string }> = [];
  
  const selectRegex = new RegExp(`<select[^>]+(?:name|id)="${selectId}"[^>]*>([\\s\\S]*?)<\/select>`, 'i');
  const selectMatch = htmlContent.match(selectRegex);
  
  if (selectMatch) {
    const optionsHtml = selectMatch[1];
    const optRegex = /<option[^>]+value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/gi;
    let optMatch;
    while ((optMatch = optRegex.exec(optionsHtml)) !== null) {
      const value = optMatch[1];
      const label = optMatch[2].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      if (value && value !== '#' && value !== '0') {
        options.push({ label, value });
      }
    }
  }
  
  return options;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceInfo, jsessionid } = body;

    if (!serviceInfo) {
      return NextResponse.json({ error: 'Missing serviceInfo parameter' }, { status: 400 });
    }

    const postParams = new URLSearchParams();
    postParams.append('radOnwardServiceID', serviceInfo);
    postParams.append('slNo', '0');

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*'
    };

    if (jsessionid) {
      headers['Cookie'] = `JSESSIONID=${jsessionid}`;
    }

    const res = await fetch('https://gsrtc.in/OPRSOnline/advanceBooking.do?hiddenAction=SubmitToGetAjaxSeatLayout', {
      method: 'POST',
      headers,
      body: postParams.toString()
    });

    if (!res.ok) {
      throw new Error(`GSRTC seat layout servlet returned status ${res.status}`);
    }

    const htmlContent = await res.text();
    const seats = parseSeatsHTML(htmlContent);
    const boardingPoints = parseSelectOptions(htmlContent, 'selectPickupPoint0');
    const droppingPoints = parseSelectOptions(htmlContent, 'selectDropOffPoint0');

    return NextResponse.json({
      seats,
      boardingPoints,
      droppingPoints
    });
  } catch (error: any) {
    console.error('Error proxying seat layout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
