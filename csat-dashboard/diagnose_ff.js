import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const lines = [];

// Distribution of Semester for the 43 rows of ekp2169
let ekpCount = 0;
const ekpSem = new Map();
rawData.forEach(row => {
  const mk2 = String(row['Mata Kuliah 2'] || '').toLowerCase();
  if (mk2.includes('ekp2169')) {
    ekpCount++;
    const sem = String(row['Semester Berjalan'] || 'empty');
    ekpSem.set(sem, (ekpSem.get(sem) || 0) + 1);
  }
});
lines.push(`EKP2169 (43 rows) Semester distribution:`);
[...ekpSem.entries()].forEach(([s,c]) => lines.push(`  ${s}: ${c}`));

// Distribution of Semester for the 40 rows of sda2141
let sdaCount = 0;
const sdaSem = new Map();
rawData.forEach(row => {
  const mk1 = String(row['Mata Kuliah'] || '').toLowerCase();
  if (mk1.includes('sda2141')) {
    sdaCount++;
    const sem = String(row['Semester Berjalan'] || 'empty');
    sdaSem.set(sem, (sdaSem.get(sem) || 0) + 1);
  }
});
lines.push(`\nSDA2141 (40 rows) Semester distribution:`);
[...sdaSem.entries()].forEach(([s,c]) => lines.push(`  ${s}: ${c}`));

// Check for all rows where Semester is Ganjil (I, III, V, VII)
let ganjilTotal = 0;
rawData.forEach(row => {
   const s = String(row['Semester Berjalan'] || '').toLowerCase();
   if (s.includes('ganjil') || s.includes('i') || s.includes('iii') || s.includes('v') || s.includes('vii')) {
      // Wait, "II" has "I" in it. Need to be careful.
   }
});

fs.writeFileSync('diagnose_final_final.txt', lines.join('\n'), 'utf8');
console.log('Done');
