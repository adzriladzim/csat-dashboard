import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData1 = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const mk1Counts = new Map();
const mk2Counts = new Map();

rawData1.forEach(row => {
  const mk1 = String(row['Mata Kuliah'] ?? '').trim().toLowerCase();
  const mk2 = String(row['Mata Kuliah 2'] ?? '').trim().toLowerCase();
  if (mk1) mk1Counts.set(mk1, (mk1Counts.get(mk1) || 0) + 1);
  if (mk2) mk2Counts.set(mk2, (mk2Counts.get(mk2) || 0) + 1);
});

const lines = [];
lines.push('=== MATA KULIAH 1 COUNTS ===');
[...mk1Counts.entries()].forEach(([mk, c]) => {
  if (c === 43 || c === 40 || c < 100) lines.push(`  ${c}: ${mk}`);
});

lines.push('\n=== MATA KULIAH 2 COUNTS ===');
[...mk2Counts.entries()].forEach(([mk, c]) => {
  if (c === 43 || c === 40 || c < 100) lines.push(`  ${c}: ${mk}`);
});

fs.writeFileSync('diagnose_mk.txt', lines.join('\n'), 'utf8');
console.log('Done');
