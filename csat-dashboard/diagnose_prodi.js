import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const prodiCounts = new Map();
const prodi2Counts = new Map();

rawData.forEach(row => {
  const p1 = String(row['Program Studi'] ?? '').trim();
  const p2 = String(row['Program Studi 2'] ?? '').trim();
  if (p1) prodiCounts.set(p1, (prodiCounts.get(p1) || 0) + 1);
  if (p2) prodi2Counts.set(p2, (prodi2Counts.get(p2) || 0) + 1);
});

const lines = [];
lines.push('=== PROGRAM STUDI 1 DISTRIBUTION ===');
[...prodiCounts.entries()].forEach(([p, c]) => lines.push(`  ${p}: ${c} ${c === 43 ? '<<< MATCH 43!' : ''}`));

lines.push('\n=== PROGRAM STUDI 2 DISTRIBUTION ===');
[...prodi2Counts.entries()].forEach(([p, c]) => lines.push(`  ${p}: ${c} ${c === 43 ? '<<< MATCH 43!' : ''}`));

// Check for empty Program Studi in both
let bothEmpty = 0;
rawData.forEach(row => {
  if (!String(row['Program Studi'] ?? '').trim() && !String(row['Program Studi 2'] ?? '').trim()) bothEmpty++;
});
lines.push(`\nBoth Empty: ${bothEmpty} ${bothEmpty === 43 ? '<<< MATCH 43!' : ''}`);

fs.writeFileSync('diagnose_prodi.txt', lines.join('\n'), 'utf8');
console.log('Done');
