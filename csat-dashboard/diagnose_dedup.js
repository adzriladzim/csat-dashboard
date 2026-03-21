import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const dups = new Map();
let removed = 0;

rawData.forEach(row => {
  const email = String(row['Email Address']).toLowerCase();
  const dosen = String(row['Nama Dosen']).toLowerCase();
  const ts = String(row['Timestamp']);
  const date = ts.split(' ')[0]; // Assuming "DD/MM/YYYY HH:MM:SS"
  
  const key = `${email}|${dosen}|${date}`;
  if (dups.has(key)) removed++;
  else dups.set(key, true);
});

const lines = [];
lines.push(`Duplicates by Email+Dosen+Date: ${removed} ${removed === 43 ? '<<< MATCH 43!' : ''}`);

// Try Email+Dosen+Pertemuan
const dups2 = new Map();
let removed2 = 0;
rawData.forEach(row => {
  const email = String(row['Email Address']).toLowerCase();
  const dosen = String(row['Nama Dosen']).toLowerCase();
  const p = String(row['Pertemuan ke']).toLowerCase();
  
  const key = `${email}|${dosen}|${p}`;
  if (dups2.has(key)) removed2++;
  else dups2.set(key, true);
});
lines.push(`Duplicates by Email+Dosen+Pertemuan: ${removed2} ${removed2 === 43 ? '<<< MATCH 43!' : ''}`);

fs.writeFileSync('diagnose_dedup.txt', lines.join('\n'), 'utf8');
console.log('Done');
