import { NextResponse } from 'next/server';
import { searchStationsByName } from '@/lib/stations-db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term') || '';

  if (term.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const stations = searchStationsByName(term);
    return NextResponse.json(stations);
  } catch (error: any) {
    console.error('Error querying stations from SQLite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
