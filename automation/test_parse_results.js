const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../automation/search_results.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function parseBusHTML(htmlContent) {
  const buses = [];
  
  // Regex to match each <li class="row-sec ..."> item representing a bus
  const rowRegex = /<li[^>]*class="[^"]*row-sec[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  
  while ((match = rowRegex.exec(htmlContent)) !== null) {
    const rowHtml = match[0];
    
    // Extract Trip Code
    // E.g., <div class="lh-24 f-bold d-color">0600JNDJMNAC45</div>
    const codeMatch = rowHtml.match(/class="lh-24 f-bold d-color">([^<]+)<\/div>/i);
    const tripCode = codeMatch ? codeMatch[1].trim() : '';
    
    // Extract Departure Time
    // Search within id="DeptTime"
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
    // E.g., <span class="WebRupee" ...>₹63.00</span>
    const fareMatch = rowHtml.match(/class="WebRupee"[^>]*>₹([^<]+)<\/span>/i);
    const fare = fareMatch ? parseFloat(fareMatch[1].replace(/,/g, '').trim()) : 0;

    // Extract Seat Info and Service ID from Javascript click handler
    // E.g., showLayOut('47934,21,AC LUXURY,204,0,00:45,06:00,JUNAGADH,JUNAGADH,JAMNAGAR,0600JNDJMNAC45,Y','0', '37')
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
      
      // Use details from serviceInfo if regex failed
      if (!duration && parts[5]) duration = parts[5];
    } else {
      // Check if it is full
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

const buses = parseBusHTML(html);
console.log(`Successfully parsed ${buses.length} buses:`);
console.log(JSON.stringify(buses.slice(0, 3), null, 2));
