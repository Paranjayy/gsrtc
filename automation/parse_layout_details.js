const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'after_click.html');
const html = fs.readFileSync(filePath, 'utf8');

// Find the main seat layout table
// It starts with some unique marker, let's find tables containing 'availableSeatnew.gif'
// and parse them to understand row/col alignment.

function parseSeatLayout(htmlContent) {
  // Let's find the table or tbody containing the seat layout.
  // Usually it has a unique container or is a large table.
  // Let's use Regex to extract all <tr> rows from the HTML.
  // Wait, let's find the parent table of availableSeatnew.gif.
  // Let's do a regex match for all <tr>...</tr> and count how many TDs are inside.
  
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  const rows = [];
  
  // We want to find the table that contains the actual layout.
  // Let's find the section that has the layout by searching for a table that has a high concentration of seat images.
  // Or we can just find all TDs that contain seat images and map their positions.
  // Wait, if we parse the DOM or use regex to parse rows and columns:
  // Let's extract the HTML snippet between the start and end of the seat layout table.
  // The layout table usually starts with something like <table width="100%" ... id="seatLayoutTable" or just <table class="layoutTable" ...
  // Let's search for "availableSeatnew" and trace back to its parent <table> or look at the structure.
  
  // Let's look at snippet.html. We see that each seat is:
  // <td width="50" align="center"><table ...> <tbody><tr>...<img ...></tr> <tr>...class="seatLayoutNoTxt"...</tr> </tbody></table></td>
  // This td itself is part of a larger row <tr> representing the row of the bus.
  // Let's write a regex that matches the parent <tr> containing these <td width="50" ...>
  
  // Let's first search for all <tr> that contain class="seatLayoutNoTxt" or availableSeatnew/bookedSeatnew.
  // We can group them by their index in the document or check if they are contiguous.
  
  const trs = [];
  const trMatches = htmlContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  
  console.log(`Found total ${trMatches.length} <tr> elements in HTML.`);
  
  // Let's filter only <tr>s that contain "seatLayoutNoTxt" and don't contain other nested tables (or if they do, we handle it).
  // Actually, a simpler way is to find the layout table.
  // Let's find the index of the first seat image and find the outer <table> start tag before it.
  const firstSeatIdx = htmlContent.indexOf('availableSeatnew.gif');
  if (firstSeatIdx === -1) {
    console.log('No seat images found!');
    return [];
  }
  
  // Search backward for the outer table
  // Let's search for '<table' backward from firstSeatIdx.
  // We want to find the table that has many seat images.
  // Let's find the table that is the container.
  // Let's write a robust parser: we can extract all TDs containing seat images, and we can also find their row/col by parsing the table.
  // Since we are running in Next.js backend, we can write a regex parser or use a small HTML parsing library if available, but a pure JS regex parser is extremely fast and has no external dependencies.
  
  // Let's parse all rows.
  // Let's look for <tr> tags that contain seat images.
  let rowIdx = 0;
  const parsedSeats = [];
  
  // Let's find all rows that contain at least one seat image.
  // We'll iterate through them.
  const seatRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let matchRow;
  
  while ((matchRow = seatRowRegex.exec(htmlContent)) !== null) {
    const rowHtml = matchRow[0];
    // Does this row contain a seat image?
    if (/bookedSeatnew|availableSeatnew|LadiesSeatnew|Sleeper-Seat/i.test(rowHtml)) {
      // It's a row of the seat layout!
      // But wait! Each seat cell itself contains a small <table> with two <tr>s (one for image, one for text).
      // So we must make sure we don't treat the inner table rows as main layout rows!
      // The inner table rows are nested inside a <td width="50" ...> or similar.
      // So the main layout rows will have nested tables.
      // Let's check if this row contains a <td[^>]*width="50"[^>]*> or similar cell.
      // If it contains multiple <td[^>]*width="50"[^>]*> cells, it's a main layout row!
      
      const cells = [];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let matchTd;
      
      // Let's find all TDs in this row that are not nested (i.e. top-level TDs of this row).
      // Since regex has no nesting understanding, we can count the number of top-level TDs.
      // A top-level TD can be extracted by splitting or custom parsing.
      // Let's do a simple count of <td width="50" or similar cells.
      const tdMatches = rowHtml.match(/<td[^>]*width="50"[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (tdMatches.length > 0) {
        rowIdx++;
        // Now parse each cell in this row!
        tdMatches.forEach((cellHtml, colIdx) => {
          // Check if this cell contains a seat image
          const imgMatch = cellHtml.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
          if (imgMatch) {
            const src = imgMatch[1];
            const isBooked = src.includes('bookedSeatnew') || src.includes('Sleeper-Seat_Booked');
            const isLadies = src.includes('LadiesSeatnew') || src.includes('Sleeper-Seat_Ladies');
            const type = src.includes('Sleeper') ? 'Berth' : 'Seat';
            
            // Extract seat number
            const labelMatch = cellHtml.match(/class="seatLayoutNoTxt"[^>]*>\s*([^<]+)\s*<\/div>/i);
            let seatNo = labelMatch ? labelMatch[1].replace(/&nbsp;/g, '').trim() : '';
            if (!seatNo) {
              // try title
              const titleMatch = imgMatch[0].match(/title="([^"]+)"/i);
              seatNo = titleMatch ? titleMatch[1].trim() : '';
            }
            
            // Extract click handler ID (for selection)
            // e.g. SelectSeat('47934-O5','47934-O5','47934')
            const clickMatch = cellHtml.match(/SelectSeat\('([^']*)'/i);
            const seatKey = clickMatch ? clickMatch[1] : '';
            
            parsedSeats.push({
              seatNo,
              seatKey,
              isBooked,
              isLadies,
              type,
              row: rowIdx,
              col: colIdx + 1
            });
          }
        });
      }
    }
  }
  return parsedSeats;
}

const seats = parseSeatLayout(html);
console.log(`Parsed ${seats.length} seats from the HTML layout:`);
console.log(JSON.stringify(seats.slice(0, 10), null, 2));

// Save parsed seats to JSON for review
fs.writeFileSync(path.join(__dirname, 'parsed_seats.json'), JSON.stringify(seats, null, 2));
