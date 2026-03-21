import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData1 = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const semCounts = new Map();
const angCounts = new Map();

rawData1.forEach(row => {
  const sem = String(row['Semester Berjalan'] ?? '').trim();
  const ang = String(row['Angkatan Perkuliahan'] ?? '').trim();
  if (sem) semCounts.set(sem, (semCounts.get(sem) || 0) + 1);
  if (ang) angCounts.set(ang, (angCounts.get(ang) || 0) + 1);
});

const lines = [];
lines.push('=== SEMESTER DISTRIBUTION ===');
[...semCounts.entries()].forEach(([v, c]) => lines.push(`  ${c}: ${v} ${c === 43 ? '<<< MATCH 43!' : ''}`));

lines.push('\n=== ANGKATAN DISTRIBUTION ===');
[...angCounts.entries()].forEach(([v, c]) => lines.push(`  ${c}: ${v} ${c === 43 ? '<<< MATCH 43!' : ''}`));

fs.writeFileSync('diagnose_time.txt', lines.join('\n'), 'utf8');
console.log('Done');
