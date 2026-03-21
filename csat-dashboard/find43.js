import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
// I don't have the path for file 2 yet, but I can assume the user has it.
// Let's just analyze file 1 for now.

const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData1 = XLSX.utils.sheet_to_json(sheet, { defval: '' });
const headers1 = Object.keys(rawData1[0]);

const lines = [];
lines.push(`Analysing file 1: ${file1}`);
lines.push(`Total rows: ${rawData1.length}`);

// 1. Search for duplicated values/patterns that occur exactly 43 times
const stats = {};
headers1.forEach(h => {
  const counts = new Map();
  rawData1.forEach(row => {
    const val = String(row[h] ?? '').trim().toLowerCase();
    counts.set(val, (counts.get(val) || 0) + 1);
  });
  
  counts.forEach((count, val) => {
    if (count === 43) {
      lines.push(`[EXACT 43] Column "${h}" has value "${val}" exactly 43 times.`);
    }
  });
});

// 2. Search for any boolean-like or patterned check that yields 43
// Check for empty fields
headers1.forEach(h => {
  let empty = 0;
  rawData1.forEach(row => {
    const val = String(row[h] ?? '').trim();
    if (!val) empty++;
  });
  if (empty === 43) lines.push(`[EXACT 43] Column "${h}" is EMPTY exactly 43 times.`);
});

// 3. Check for specific word counts
const keywords = ['tidak ada', 'oke', 'bagus', 'kurang', 'baik', 'dosen', 'nama'];
keywords.forEach(kw => {
  headers1.forEach(h => {
    let matches = 0;
    rawData1.forEach(row => {
      const val = String(row[h] ?? '').toLowerCase();
      if (val.includes(kw)) matches++;
    });
    if (matches === 43) lines.push(`[EXACT 43] Column "${h}" contains "${kw}" exactly 43 times.`);
  });
});

// 4. Check for duplicate submissions by different keys
const keys = [
  ['NIM', 'Nama Dosen', 'Pertemuan ke'],
  ['Email Address', 'Nama Dosen', 'Pertemuan ke'],
  ['NIM', 'Nama Dosen', 'Mata Kuliah', 'Pertemuan ke'],
  ['Email Address', 'Nama Dosen', 'Mata Kuliah', 'Pertemuan ke'],
];

keys.forEach(keyGroup => {
  const map = new Map();
  let dups = 0;
  rawData1.forEach(row => {
    const key = keyGroup.map(k => String(row[k] ?? '').toLowerCase()).join('|');
    if (map.has(key)) dups++;
    else map.set(key, true);
  });
  if (dups === 43) lines.push(`[EXACT 43] Duplicate key ${keyGroup.join('+')} appears 43 times.`);
});

// 5. Check for null or invalid scores using strict parsing
function parseScore(val) {
  if (!val) return null;
  const s = String(val).trim();
  const m = s.match(/^\((\d+(?:\.\d+)?)\)/);
  if (m) { const n = parseFloat(m[1]); if (!isNaN(n) && n >= 1 && n <= 5) return n; }
  if (/^\d+(?:\.\d+)?$/.test(s)) {
    const n = parseFloat(s);
    return (!isNaN(n) && n >= 1 && n <= 5) ? n : null;
  }
  return null;
}

const colP = headers1.find(h => h.toLowerCase().includes('pemahaman'));
const colI = headers1.find(h => h.toLowerCase().includes('interaktif'));
const colF = headers1.find(h => h.toLowerCase().includes('performa'));

let invalidP = 0, invalidI = 0, invalidF = 0, invalidAny = 0;
rawData1.forEach(row => {
  const sP = parseScore(row[colP]);
  const sI = parseScore(row[colI]);
  const sF = parseScore(row[colF]);
  if (sP === null) invalidP++;
  if (sI === null) invalidI++;
  if (sF === null) invalidF++;
  if (sP === null || sI === null || sF === null) invalidAny++;
});

lines.push(`Invalid scores: P=${invalidP}, I=${invalidI}, F=${invalidF}, Any=${invalidAny}`);

fs.writeFileSync('diagnose_find43.txt', lines.join('\n'), 'utf8');
console.log('Done');
