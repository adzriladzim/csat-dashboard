import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
const headers = Object.keys(rawData[0]);

const lines = [];

// Check gmail vs academic email
let gmailCount = 0;
let academicCount = 0;
let otherCount = 0;
rawData.forEach(row => {
  const email = String(row['Email Address'] || '').trim().toLowerCase();
  if (email.includes('gmail.com')) gmailCount++;
  else if (email.includes('cakrawala.ac.id')) academicCount++;
  else otherCount++;
});
lines.push(`Gmail: ${gmailCount}, Academic: ${academicCount}, Other: ${otherCount}`);

// Perhaps it's about rows where BOTH Program Studi and Mata Kuliah are empty
// (Block B data that has different column names)
let emptyProdiAndMK = 0;
rawData.forEach(row => {
  const prodi = String(row['Program Studi'] ?? '').trim();
  const mk = String(row['Mata Kuliah'] ?? '').trim();
  const prodi2 = String(row['Program Studi 2'] ?? '').trim();
  const mk2 = String(row['Mata Kuliah 2'] ?? '').trim();
  if (!prodi && !mk && !prodi2 && !mk2) emptyProdiAndMK++;
});
lines.push(`Empty BOTH Prodi AND MataKuliah (both blocks): ${emptyProdiAndMK}`);

// Check if the 43 is about rows where Nama Dosen is empty/short
let emptyDosen = 0;
rawData.forEach(row => {
  const dosen = String(row['Nama Dosen'] ?? '').trim();
  if (!dosen || dosen.length < 3) emptyDosen++;
});
lines.push(`Empty/Short Nama Dosen: ${emptyDosen}`);

// Check if 43 is about rows with no Pertemuan
let emptyPertemuan = 0;
rawData.forEach(row => {
  const p = String(row['Pertemuan ke'] ?? '').trim();
  if (!p) emptyPertemuan++;
});
lines.push(`Empty Pertemuan: ${emptyPertemuan}`);

// Check by Email+Dosen (ignoring pertemuan and matkul)
const byEmailDosen = new Map();
let dupED = 0;
rawData.forEach((row, i) => {
  const key = `${row['Email Address']}|${row['Nama Dosen']}`.toLowerCase();
  if (!byEmailDosen.has(key)) byEmailDosen.set(key, []);
  byEmailDosen.get(key).push(i);
});
let dupByED = 0;
byEmailDosen.forEach(indices => { if (indices.length > 1) dupByED += indices.length - 1; });
lines.push(`Duplicates by Email+Dosen: ${dupByED}`);

// Check what happens if we try Email+Nama Dosen+Kode Kelas
const byENK = new Map();
let dupENK = 0;
rawData.forEach((row, i) => {
  const kk = String(row['Kode Kelas'] || row['Kode Kelas 2'] || '').trim().toLowerCase();
  const key = `${row['Email Address']}|${row['Nama Dosen']}|${kk}`.toLowerCase();
  if (byENK.has(key)) dupENK++;
  else byENK.set(key, i);
});
lines.push(`Duplicates by Email+Dosen+KodeKelas: ${dupENK}`);

// Maybe the answer is: email + mata kuliah + pertemuan (no dosen)
const byEMP = new Map();
let dupEMP = 0;
rawData.forEach((row, i) => {
  const mk = String(row['Mata Kuliah'] || row['Mata Kuliah 2'] || '').trim().toLowerCase();
  const key = `${row['Email Address']}|${mk}|${row['Pertemuan ke']}`.toLowerCase();
  if (byEMP.has(key)) dupEMP++;
  else byEMP.set(key, i);
});
lines.push(`Duplicates by Email+MataKuliah+Pertemuan: ${dupEMP}`);

// Maybe email + kode kelas + pertemuan
const byEKP = new Map();
let dupEKP = 0;
rawData.forEach((row, i) => {
  const kk = String(row['Kode Kelas'] || row['Kode Kelas 2'] || '').trim().toLowerCase();
  const key = `${row['Email Address']}|${kk}|${row['Pertemuan ke']}`.toLowerCase();
  if (byEKP.has(key)) dupEKP++;
  else byEKP.set(key, i);
});
lines.push(`Duplicates by Email+KodeKelas+Pertemuan: ${dupEKP}`);

// Let me also try: NIM + Mata Kuliah + Pertemuan
const byNMP = new Map();
let dupNMP = 0;
rawData.forEach((row, i) => {
  const nim = String(row['NIM'] || row['NIM 2'] || '').trim().toLowerCase();
  const mk = String(row['Mata Kuliah'] || row['Mata Kuliah 2'] || '').trim().toLowerCase();
  const key = `${nim}|${mk}|${row['Pertemuan ke']}`.toLowerCase();
  if (byNMP.has(key)) dupNMP++;
  else byNMP.set(key, i);
});
lines.push(`Duplicates by NIM+MataKuliah+Pertemuan: ${dupNMP}`);

// And: NIM + Kode Kelas + Pertemuan
const byNKP = new Map();
let dupNKP = 0;
rawData.forEach((row, i) => {
  const nim = String(row['NIM'] || row['NIM 2'] || '').trim().toLowerCase();
  const kk = String(row['Kode Kelas'] || row['Kode Kelas 2'] || '').trim().toLowerCase();
  const key = `${nim}|${kk}|${row['Pertemuan ke']}`.toLowerCase();
  if (byNKP.has(key)) dupNKP++;
  else byNKP.set(key, i);
});
lines.push(`Duplicates by NIM+KodeKelas+Pertemuan: ${dupNKP}`);

// Target: exactly 43
lines.push('');
lines.push('=== SEARCHING FOR EXACT 43 MATCH ===');
const results = [
  ['Email+Dosen+Pertemuan', 237],
  ['NIM+Dosen+Pertemuan', 240],
  ['Email+Dosen+MK+Pertemuan', 168],
  ['Email+Dosen', dupByED],
  ['Email+Dosen+KodeKelas', dupENK],
  ['Email+MK+Pertemuan', dupEMP],
  ['Email+KodeKelas+Pertemuan', dupEKP],
  ['NIM+MK+Pertemuan', dupNMP],
  ['NIM+KodeKelas+Pertemuan', dupNKP],
  ['NIM+Dosen+Pertemuan+MK', 154],
  ['EmptyDosen', emptyDosen],
  ['EmptyPertemuan', emptyPertemuan],
  ['ShortNim', 15],
];
results.forEach(([name, count]) => {
  lines.push(`  ${name}: ${count} ${count === 43 ? '<<< MATCH!!!' : ''}`);
});

fs.writeFileSync('diagnose_result4.txt', lines.join('\n'), 'utf8');
console.log('Done');
