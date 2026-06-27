import { NextResponse } from 'next/server';
import { getStationByCode } from '@/lib/stations-db';

/**
 * GET /api/via-resolve?codes=djr,jkndr,klvd
 * Returns an array of { code, name } objects.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const codesParam = searchParams.get('codes') || '';

  const codes = codesParam.split(/[,\s]+/).filter(Boolean);
  const resolved = codes.map(code => {
    const row = getStationByCode(code);
    return { code, name: row ? row.name : code.toUpperCase() };
  });

  return NextResponse.json(resolved);
}
