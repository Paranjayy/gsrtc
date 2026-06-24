import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term') || '';
  const type = searchParams.get('type') || 'from'; // 'from' or 'to'

  if (term.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const hiddenAction = type === 'from' ? 'LoadFromPlaceList' : 'LoadTOPlaceList';
    const placeParam = type === 'from' ? 'matchStartPlace' : 'matchEndPlace';
    const postBody = `hiddenAction=${hiddenAction}&term=${encodeURIComponent(term)}&${placeParam}=${encodeURIComponent(term)}`;

    const res = await fetch('https://gsrtc.in/OPRSOnline/jqreq.do?', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      body: postBody
    });

    if (!res.ok) {
      throw new Error(`GSRTC server returned status ${res.status}`);
    }

    const text = await res.text();
    
    // Parse caret-separated response: e.g. "57:JND:JUNAGADH^4993:Junag:Junagadh (Local)^"
    const items = text.split('^').filter(Boolean);
    const stations = items.map(item => {
      const parts = item.split(':');
      return {
        id: parts[0] || '',
        code: parts[1] || '',
        name: parts[2] || ''
      };
    });

    return NextResponse.json(stations);
  } catch (error: any) {
    console.error('Error proxying stations autocomplete:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
