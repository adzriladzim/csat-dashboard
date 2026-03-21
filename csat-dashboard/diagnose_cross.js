import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const dups_email_pertemuan = new Map();
let removed1 = 0;
rawData.forEach(row => {
  const email = String(row['Email Address']).toLowerCase();
  const p = String(row['Pertemuan ke']).toLowerCase();
  const key = `${email}|${p}`;
  if (dups_email_pertemuan.has(key)) removed1++;
  else dups_email_pertemuan.set(key, true);
});

const dups_nim_pertemuan = new Map();
let removed2 = 0;
rawData.forEach(row => {
  const nim = String(row['NIM'] || row['NIM 2'] || '').trim().toLowerCase();
  const p = String(row['Pertemuan ke']).toLowerCase();
  const key = `${nim}|${p}`;
  if (dups_nim_pertemuan.has(key)) removed2++;
  else dups_nim_pertemuan.set(key, true);
});

const lines = [];
lines.push(`Duplicates by Email+Pertemuan: ${removed1} ${removed1 === 43 ? '<<< MATCH 43!' : ''}`);
lines.push(`Duplicates by NIM+Pertemuan: ${removed2} ${removed2 === 43 ? '<<< MATCH 43!' : ''}`);

// Try Timestamp (seconds only)
const dups_ts = new Map();
let removed3 = 0;
rawData.forEach(row => {
  const ts = String(row['Timestamp']).toLowerCase();
  if (dups_ts.has(ts)) removed3++;
  else dups_ts.set(ts, true);
});
lines.push(`Duplicates by Exact Timestamp: ${removed3} ${removed3 === 43 ? '<<< MATCH 43!' : ''}`);

fs.writeFileSync('diagnose_cross.txt', lines.join('\n'), 'utf8');
console.log('Done');
