import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const dosenCounts = new Map();

rawData.forEach(row => {
  const d = String(row['Nama Dosen'] ?? '').trim();
  dosenCounts.set(d, (dosenCounts.get(d) || 0) + 1);
});

const lines = [];
lines.push('=== DOSEN DISTRIBUTION ===');
[...dosenCounts.entries()].sort((a,b) => a[1]-b[1]).forEach(([d, c]) => {
  lines.push(`  ${c}: ${d} ${c === 43 ? '<<< MATCH 43!' : ''}`);
});

fs.writeFileSync('diagnose_dosen.txt', lines.join('\n'), 'utf8');
console.log('Done');
