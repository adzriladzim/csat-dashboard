import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
const headers = Object.keys(rawData[0]);

const colP = headers.find(h => h.toLowerCase().includes('pemahaman'));
const colI = headers.find(h => h.toLowerCase().includes('interaktif'));
const colF = headers.find(h => h.toLowerCase().includes('performa'));

const pVals = new Map();
const iVals = new Map();
const fVals = new Map();

rawData.forEach(row => {
  const p = String(row[colP] ?? '').trim();
  const i = String(row[colI] ?? '').trim();
  const f = String(row[colF] ?? '').trim();
  pVals.set(p, (pVals.get(p) || 0) + 1);
  iVals.set(i, (iVals.get(i) || 0) + 1);
  fVals.set(f, (fVals.get(f) || 0) + 1);
});

const lines = [];
lines.push('=== PEMAHAMAN VALUE DISTRIBUTION ===');
[...pVals.entries()].sort((a,b) => b[1]-a[1]).forEach(([v, c]) => lines.push(`  ${c}: ${JSON.stringify(v)}`));

lines.push('\n=== INTERAKTIF VALUE DISTRIBUTION ===');
[...iVals.entries()].sort((a,b) => b[1]-a[1]).forEach(([v, c]) => lines.push(`  ${c}: ${JSON.stringify(v)}`));

lines.push('\n=== PERFORMA VALUE DISTRIBUTION ===');
[...fVals.entries()].sort((a,b) => b[1]-a[1]).forEach(([v, c]) => lines.push(`  ${c}: ${JSON.stringify(v)}`));

fs.writeFileSync('diagnose_values.txt', lines.join('\n'), 'utf8');
console.log('Done');
