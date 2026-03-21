import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
const headers = Object.keys(rawData[0]);

const lines = [];

const testKeywords = ['test', 'coba', 'dummy', 'admin', 'responden', 'validasi', 'percobaan'];

testKeywords.forEach(kw => {
  let count = 0;
  rawData.forEach(row => {
    const rowText = JSON.stringify(row).toLowerCase();
    if (rowText.includes(kw)) count++;
  });
  lines.push(`Keyword "${kw}" appears in ${count} rows.`);
});

// Check for empty Program Studi AND Mata Kuliah (Block B compatibility)
let blockBEmpty = 0;
rawData.forEach(row => {
  const p1 = String(row['Program Studi'] ?? '').trim();
  const mk1 = String(row['Mata Kuliah'] ?? '').trim();
  const p2 = String(row['Program Studi 2'] ?? '').trim();
  const mk2 = String(row['Mata Kuliah 2'] ?? '').trim();
  if (!p1 && !mk1 && !p2 && !mk2) blockBEmpty++;
});
lines.push(`Both Prodi/MK empty: ${blockBEmpty}`);

// Check for duplicates by a very specific key: NIM + Nama Dosen + Pertemuan ke
const keyCheck = new Map();
let dups = 0;
rawData.forEach(row => {
  const nim = String(row['NIM'] || row['NIM 2'] || '').trim().toLowerCase();
  const dosen = String(row['Nama Dosen'] || '').trim().toLowerCase();
  const p = String(row['Pertemuan ke'] || '').trim();
  const key = `${nim}|${dosen}|${p}`;
  if (keyCheck.has(key)) dups++;
  else keyCheck.set(key, true);
});
lines.push(`Duplicates by NIM+Dosen+Pertemuan: ${dups}`);

// WAIT! What if the 43 rows are "Duplicate Submissions" where the Timestamp is IDENTICAL?
const tsCheck = new Map();
let tsDups = 0;
rawData.forEach(row => {
  const ts = String(row['Timestamp']).toLowerCase();
  const email = String(row['Email Address']).toLowerCase();
  const key = `${ts}|${email}`;
  if (tsCheck.has(key)) tsDups++;
  else tsCheck.set(key, true);
});
lines.push(`Duplicates by Timestamp+Email: ${tsDups}`);

// Try combination: Duplicates by NIM+Dosen+MataKuliah (ignoring pertemuan)
const keyCheck2 = new Map();
let dups2 = 0;
rawData.forEach(row => {
  const nim = String(row['NIM'] || row['NIM 2'] || '').trim().toLowerCase();
  const dosen = String(row['Nama Dosen'] || '').trim().toLowerCase();
  const mk = String(row['Mata Kuliah'] || row['Mata Kuliah 2'] || '').trim().toLowerCase();
  const key = `${nim}|${dosen}|${mk}`;
  if (keyCheck2.has(key)) dups2++;
  else keyCheck2.set(key, true);
});
lines.push(`Duplicates by NIM+Dosen+MataKuliah: ${dups2}`);

fs.writeFileSync('diagnose_keywords.txt', lines.join('\n'), 'utf8');
console.log('Done');
