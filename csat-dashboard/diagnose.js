
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

console.log(`Total rows: ${rawData.length}`);
console.log(`\n=== ALL HEADERS (${Object.keys(rawData[0]).length} columns) ===`);
Object.keys(rawData[0]).forEach((h, i) => {
  console.log(`  [${i}] "${h}"`);
});

// Find score columns by checking which headers contain key phrases
const headers = Object.keys(rawData[0]);
console.log(`\n=== SEARCHING FOR SCORE COLUMNS ===`);

const scoreKeywords = [
  { name: 'Pemahaman', must: ['paham'], mustNot: ['faktor','mengapa','alasan','topik'] },
  { name: 'Interaktif', must: ['interaktif'], mustNot: ['faktor','mengapa','alasan'] },
  { name: 'Performa', must: ['performa'], mustNot: ['faktor','mengapa','alasan'] },
];

scoreKeywords.forEach(sk => {
  const matches = headers.filter(h => {
    const lh = h.toLowerCase();
    return sk.must.every(k => lh.includes(k)) && !sk.mustNot.some(k => lh.includes(k));
  });
  console.log(`\n  ${sk.name} matches (${matches.length}):`);
  matches.forEach(m => console.log(`    "${m.substring(0, 80)}..."`));
});

// Now count how many rows have EMPTY values in each score column
// Use the FIRST match for each score type
function findScoreCol(must, mustNot) {
  return headers.find(h => {
    const lh = h.toLowerCase();
    return must.every(k => lh.includes(k)) && !mustNot.some(k => lh.includes(k));
  });
}

const colPemahaman  = findScoreCol(['paham'], ['faktor','mengapa','alasan','topik']);
const colInteraktif = findScoreCol(['interaktif'], ['faktor','mengapa','alasan']);
const colPerforma   = findScoreCol(['performa'], ['faktor','mengapa','alasan']);

console.log(`\n=== SELECTED SCORE COLUMNS ===`);
console.log(`  Pemahaman:  "${colPemahaman?.substring(0, 80)}"`);
console.log(`  Interaktif: "${colInteraktif?.substring(0, 80)}"`);
console.log(`  Performa:   "${colPerforma?.substring(0, 80)}"`);

// Count rows with missing scores
let missingPemahaman = 0, missingInteraktif = 0, missingPerforma = 0;
let missingAny = 0;
const missingRows = [];

rawData.forEach((row, i) => {
  const vP = colPemahaman  ? String(row[colPemahaman] ?? '').trim() : '';
  const vI = colInteraktif ? String(row[colInteraktif] ?? '').trim() : '';
  const vF = colPerforma   ? String(row[colPerforma] ?? '').trim() : '';
  
  const pMissing = !vP || vP === '';
  const iMissing = !vI || vI === '';
  const fMissing = !vF || vF === '';
  
  if (pMissing) missingPemahaman++;
  if (iMissing) missingInteraktif++;
  if (fMissing) missingPerforma++;
  
  if (pMissing || iMissing || fMissing) {
    missingAny++;
    if (missingRows.length < 10) {
      missingRows.push({
        row: i + 2,
        pemahaman: vP || '(EMPTY)',
        interaktif: vI || '(EMPTY)',
        performa: vF || '(EMPTY)',
        namaDosen: String(row['Nama Dosen'] ?? row[headers.find(h => h.toLowerCase().includes('nama dosen'))] ?? '').substring(0, 30),
      });
    }
  }
});

console.log(`\n=== MISSING SCORE ANALYSIS ===`);
console.log(`  Total rows: ${rawData.length}`);
console.log(`  Missing Pemahaman:  ${missingPemahaman}`);
console.log(`  Missing Interaktif: ${missingInteraktif}`);
console.log(`  Missing Performa:   ${missingPerforma}`);
console.log(`  Missing ANY score:  ${missingAny}`);
console.log(`  Valid (all 3):      ${rawData.length - missingAny}`);
console.log(`  Expected:           7201`);

console.log(`\n=== SAMPLE MISSING ROWS (first 10) ===`);
console.table(missingRows);

// Also check what parseScore would return
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

// Check how many rows have PARSEABLE scores
let parseable = 0;
rawData.forEach(row => {
  const vP = colPemahaman  ? parseScore(row[colPemahaman])  : null;
  const vI = colInteraktif ? parseScore(row[colInteraktif]) : null;
  const vF = colPerforma   ? parseScore(row[colPerforma])   : null;
  if (vP !== null && vI !== null && vF !== null) parseable++;
});

console.log(`\n=== PARSEABLE SCORE ANALYSIS ===`);
console.log(`  Rows with all 3 parseable scores: ${parseable}`);
console.log(`  This should equal 7201 if our logic is correct`);
