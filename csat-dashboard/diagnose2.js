import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
const headers = Object.keys(rawData[0]);

const lines = [];
lines.push(`Total rows: ${rawData.length}`);
lines.push(`Total columns: ${headers.length}`);
lines.push('');
lines.push('=== ALL HEADERS ===');
headers.forEach((h, i) => lines.push(`  [${i}] ${JSON.stringify(h)}`));

// Find score columns
function findCol(must, mustNot) {
  return headers.filter(h => {
    const lh = h.toLowerCase();
    return must.every(k => lh.includes(k)) && !mustNot.some(k => lh.includes(k));
  });
}

lines.push('');
lines.push('=== PEMAHAMAN candidates ===');
findCol(['paham'], ['faktor','mengapa','alasan','topik']).forEach(c => lines.push(`  ${JSON.stringify(c)}`));

lines.push('=== INTERAKTIF candidates ===');
findCol(['interaktif'], ['faktor','mengapa','alasan']).forEach(c => lines.push(`  ${JSON.stringify(c)}`));

lines.push('=== PERFORMA candidates ===');
findCol(['performa'], ['faktor','mengapa','alasan']).forEach(c => lines.push(`  ${JSON.stringify(c)}`));

lines.push('');
lines.push('=== FAKTOR columns (should be excluded) ===');
findCol(['faktor'], []).forEach(c => lines.push(`  ${JSON.stringify(c)}`));

// Use exact first match for each
const colP = findCol(['paham'], ['faktor','mengapa','alasan','topik'])[0];
const colI = findCol(['interaktif'], ['faktor','mengapa','alasan'])[0];
const colF = findCol(['performa'], ['faktor','mengapa','alasan'])[0];

lines.push('');
lines.push(`SELECTED: Pemahaman = ${JSON.stringify(colP)}`);
lines.push(`SELECTED: Interaktif = ${JSON.stringify(colI)}`);
lines.push(`SELECTED: Performa = ${JSON.stringify(colF)}`);

// Parse score function matching rowParser.js
function parseScore(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  const m = s.match(/^\((\d+(?:\.\d+)?)\)/);
  if (m) { const n = parseFloat(m[1]); if (!isNaN(n) && n >= 1 && n <= 5) return n; }
  if (/^\d+(?:\.\d+)?$/.test(s)) {
    const n = parseFloat(s);
    return (!isNaN(n) && n >= 1 && n <= 5) ? n : null;
  }
  return null;
}

// Count
let allThree = 0, missingAny = 0;
const missing = [];
const sampleValues = new Set();

rawData.forEach((row, i) => {
  const rawP = colP ? String(row[colP] ?? '').trim() : '';
  const rawI = colI ? String(row[colI] ?? '').trim() : '';
  const rawF = colF ? String(row[colF] ?? '').trim() : '';
  const sP = parseScore(rawP);
  const sI = parseScore(rawI);
  const sF = parseScore(rawF);
  
  if (sP !== null && sI !== null && sF !== null) {
    allThree++;
  } else {
    missingAny++;
    if (missing.length < 15) {
      missing.push(`Row ${i+2}: P="${rawP}" (${sP}), I="${rawI}" (${sI}), F="${rawF}" (${sF})`);
    }
    // Collect sample raw values that fail parsing
    if (rawP && sP === null) sampleValues.add(`P: "${rawP.substring(0,50)}"`);
    if (rawI && sI === null) sampleValues.add(`I: "${rawI.substring(0,50)}"`);
    if (rawF && sF === null) sampleValues.add(`F: "${rawF.substring(0,50)}"`);
  }
});

lines.push('');
lines.push('=== RESULTS ===');
lines.push(`All 3 scores valid: ${allThree}`);
lines.push(`Missing any score:  ${missingAny}`);
lines.push(`Target:             7201 (diff=${rawData.length - 7201})`);
lines.push('');
lines.push('=== SAMPLE MISSING ROWS ===');
missing.forEach(m => lines.push(`  ${m}`));
lines.push('');
lines.push('=== UNPARSEABLE VALUES (values that have text but fail parseScore) ===');
[...sampleValues].slice(0, 20).forEach(v => lines.push(`  ${v}`));

fs.writeFileSync('diagnose_result.txt', lines.join('\n'), 'utf8');
console.log('Done. Output in diagnose_result.txt');
