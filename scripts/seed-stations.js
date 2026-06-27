/**
 * One-time seed script: reads stations_list.json and populates stations.db
 * Run with: node scripts/seed-stations.js
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'stations_list.json');
const dbPath = path.join(__dirname, '..', 'stations.db');

console.log('Reading stations_list.json...');
const stations = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
console.log(`Loaded ${stations.length} stations.`);

// Remove existing DB if re-seeding
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Removed existing stations.db');
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    id   TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_code ON stations(code COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_name ON stations(name COLLATE NOCASE);
`);

const insert = db.prepare('INSERT INTO stations (id, code, name) VALUES (?, ?, ?)');

const insertMany = db.transaction((rows) => {
  for (const s of rows) {
    insert.run(s.id, s.code, s.name);
  }
});

insertMany(stations);
db.close();

console.log(`Done! stations.db created at: ${dbPath}`);
console.log(`Total rows: ${stations.length}`);
