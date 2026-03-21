import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
const headers = Object.keys(rawData[0]);

const lines = [];

// Check for duplicates by various keys
lines.push('=== DUPLICATE ANALYSIS ===');

// By Timestamp + Email
const byTsEmail = new Map();
let dupTsEmail = 0;
rawData.forEach((row, i) => {
  const key = `${row['Timestamp']}|${row['Email Address']}`.toLowerCase();
  if (byTsEmail.has(key)) dupTsEmail++;
  else byTsEmail.set(key, i);
});
lines.push(`Duplicates by Timestamp+Email: ${dupTsEmail} (unique: ${byTsEmail.size})`);

// By Timestamp + NIM
const byTsNim = new Map();
let dupTsNim = 0;
rawData.forEach((row, i) => {
  const key = `${row['Timestamp']}|${row['NIM']}`.toLowerCase();
  if (byTsNim.has(key)) dupTsNim++;
  else byTsNim.set(key, i);
});
lines.push(`Duplicates by Timestamp+NIM: ${dupTsNim} (unique: ${byTsNim.size})`);

// By Email + Dosen + Pertemuan
const byEmailDosenPertemuan = new Map();
let dupEDP = 0;
rawData.forEach((row, i) => {
  const key = `${row['Email Address']}|${row['Nama Dosen']}|${row['Pertemuan ke']}`.toLowerCase();
  if (byEmailDosenPertemuan.has(key)) dupEDP++;
  else byEmailDosenPertemuan.set(key, i);
});
lines.push(`Duplicates by Email+Dosen+Pertemuan: ${dupEDP} (unique: ${byEmailDosenPertemuan.size})`);

// By NIM + Dosen + Pertemuan
const byNimDosenPertemuan = new Map();
let dupNDP = 0;
rawData.forEach((row, i) => {
  const key = `${row['NIM']}|${row['Nama Dosen']}|${row['Pertemuan ke']}`.toLowerCase();
  if (byNimDosenPertemuan.has(key)) dupNDP++;
  else byNimDosenPertemuan.set(key, i);
});
lines.push(`Duplicates by NIM+Dosen+Pertemuan: ${dupNDP} (unique: ${byNimDosenPertemuan.size})`);

// By Email + Dosen + MataKuliah + Pertemuan
const byEDMP = new Map();
let dupEDMP = 0;
rawData.forEach((row, i) => {
  const key = `${row['Email Address']}|${row['Nama Dosen']}|${row['Mata Kuliah']}|${row['Pertemuan ke']}`.toLowerCase();
  if (byEDMP.has(key)) dupEDMP++;
  else byEDMP.set(key, i);
});
lines.push(`Duplicates by Email+Dosen+MataKuliah+Pertemuan: ${dupEDMP} (unique: ${byEDMP.size})`);

// Check missing fields
lines.push('');
lines.push('=== MISSING FIELD ANALYSIS ===');
const fields = ['Timestamp','Email Address','Nama Mahasiswa','NIM','Angkatan Perkuliahan',
  'Semester Berjalan','Fakultas','Program Studi','Mata Kuliah','Kode Kelas','Nama Dosen','Pertemuan ke'];
fields.forEach(f => {
  let empty = 0;
  rawData.forEach(row => {
    const v = String(row[f] ?? '').trim();
    if (!v) empty++;
  });
  if (empty > 0) lines.push(`  "${f}": ${empty} empty`);
});

// Check for rows where NIM is just whitespace or very short
let shortNim = 0;
rawData.forEach(row => {
  const nim = String(row['NIM'] ?? '').trim();
  if (nim.length < 3) shortNim++;
});
lines.push(`  Short NIM (<3 chars): ${shortNim}`);

// Check for rows where Nama Mahasiswa is empty or short
let shortName = 0;
rawData.forEach(row => {
  const name = String(row['Nama Mahasiswa'] ?? '').trim();
  if (name.length < 2) shortName++;
});
lines.push(`  Short Nama (<2 chars): ${shortName}`);

// Check by Email domain
const emailDomains = new Map();
rawData.forEach(row => {
  const email = String(row['Email Address'] ?? '').trim();
  const domain = email.split('@')[1] || '(no-email)';
  emailDomains.set(domain, (emailDomains.get(domain) || 0) + 1);
});
lines.push('');
lines.push('=== EMAIL DOMAINS ===');
[...emailDomains.entries()].sort((a,b) => b[1]-a[1]).forEach(([d,c]) => lines.push(`  ${d}: ${c}`));

// Check for EXACT duplicate rows (all fields identical)
const byAllFields = new Map();
let exactDups = 0;
rawData.forEach((row, i) => {
  const key = JSON.stringify(row);
  if (byAllFields.has(key)) exactDups++;
  else byAllFields.set(key, i);
});
lines.push('');
lines.push(`Exact duplicate rows (all fields): ${exactDups}`);

// Try NIM + Dosen + Pertemuan + MataKuliah
const byNDPM = new Map();
let dupNDPM = 0;
rawData.forEach((row, i) => {
  const nim = String(row['NIM'] || row['NIM 2'] || '').trim().toLowerCase();
  const dosen = String(row['Nama Dosen'] || '').trim().toLowerCase();
  const pertemuan = String(row['Pertemuan ke'] || '').trim().toLowerCase();
  const mk = String(row['Mata Kuliah'] || row['Mata Kuliah 2'] || '').trim().toLowerCase();
  const key = `${nim}|${dosen}|${pertemuan}|${mk}`;
  if (byNDPM.has(key)) {
    dupNDPM++;
    if (dupNDPM <= 5) lines.push(`  DUP: row ${i+2} same as row ${byNDPM.get(key)+2}: ${key.substring(0,80)}`);
  }
  else byNDPM.set(key, i);
});
lines.push('');
lines.push(`Duplicates by NIM+Dosen+Pertemuan+MataKuliah: ${dupNDPM}`);

fs.writeFileSync('diagnose_result3.txt', lines.join('\n'), 'utf8');
console.log('Done');
