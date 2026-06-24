const fs = require('fs');

async function scrapeStations() {
  const stationsMap = new Map();

  const fetchPrefix = async (prefix) => {
    const postBody = `hiddenAction=LoadFromPlaceList&term=${encodeURIComponent(prefix)}&matchStartPlace=${encodeURIComponent(prefix)}`;
    
    try {
      const res = await fetch('https://gsrtc.in/OPRSOnline/jqreq.do?', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: postBody
      });
      
      const text = await res.text();
      const items = text.split('^').filter(Boolean);
      
      let count = 0;
      items.forEach(item => {
        const parts = item.split(':');
        if (parts.length >= 3) {
          const id = parts[0];
          const code = parts[1];
          const name = parts[2];
          if (!stationsMap.has(id)) {
            stationsMap.set(id, { id, code, name });
            count++;
          }
        }
      });
      
      console.log(`Prefix '${prefix}': Found ${items.length} items. Added ${count} new stations. Total unique: ${stationsMap.size}`);
    } catch (e) {
      console.error(`Error for prefix '${prefix}':`, e.message);
    }
  };

  // Generate a-z
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  
  // We'll do a 2-letter combination to avoid truncation if there's a hard limit per query
  for (let i = 0; i < alphabet.length; i++) {
    for (let j = 0; j < alphabet.length; j++) {
      const prefix = alphabet[i] + alphabet[j];
      await fetchPrefix(prefix);
      // slight delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Convert to array and save
  const stationsArr = Array.from(stationsMap.values());
  stationsArr.sort((a, b) => a.name.localeCompare(b.name));
  
  fs.writeFileSync('stations_list.json', JSON.stringify(stationsArr, null, 2));
  console.log(`Done! Scraped ${stationsArr.length} total unique stations.`);
}

scrapeStations();
