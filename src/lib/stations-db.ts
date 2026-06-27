import Database from 'better-sqlite3';
import path from 'path';

// Singleton: reuse the same connection across hot-reloads in dev
const globalForDb = global as unknown as { stationsDb?: Database.Database };

function getDb(): Database.Database {
  if (!globalForDb.stationsDb) {
    const dbPath = path.join(process.cwd(), 'stations.db');
    globalForDb.stationsDb = new Database(dbPath, { readonly: true });
  }
  return globalForDb.stationsDb;
}

export interface StationRow {
  id: string;
  code: string;
  name: string;
}

/** Look up a station by its code (case-insensitive). */
export function getStationByCode(code: string): StationRow | undefined {
  const db = getDb();
  return db.prepare('SELECT id, code, name FROM stations WHERE code = ? COLLATE NOCASE LIMIT 1').get(code) as StationRow | undefined;
}

/** Search stations by partial name (case-insensitive), returns up to `limit` results. */
export function searchStationsByName(term: string, limit = 20): StationRow[] {
  const db = getDb();
  return db.prepare("SELECT id, code, name FROM stations WHERE name LIKE ? COLLATE NOCASE LIMIT ?").all(`%${term}%`, limit) as StationRow[];
}

/** Resolve a comma/space-separated list of via codes to full names. */
export function resolveViaCodes(via: string): string {
  const codes = via.split(/[,\s]+/).filter(Boolean);
  return codes.map(code => {
    const row = getStationByCode(code);
    return row ? row.name : code.toUpperCase();
  }).join(' → ');
}
