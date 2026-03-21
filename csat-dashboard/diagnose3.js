import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
const headers = Object.keys(rawData[0]);

const lines = [];

// Check the EXACT Pemahaman header character by character
const pHeader = headers[16];
lines.push(`Pemahaman header [16]: ${JSON.stringify(pHeader)}`);
lines.push(`Length: ${pHeader.length}`);
lines.push(`Char codes: ${[...pHeader].map(c => c.charCodeAt(0)).join(',')}`);

// Test each keyword individually
const kw1 = ['bagaimana','pemahaman','kelas'];
kw1.forEach(k => {
  lines.push(`  "${k}" in header? ${pHeader.toLowerCase().includes(k)}`);
});

const kw2 = ['Seberapa','paham','materi'];
kw2.forEach(k => {
  lines.push(`  "${k}" in header? ${pHeader.toLowerCase().includes(k.toLowerCase())}`);
});

// Now try SIMPLE single-keyword matching
lines.push('');
lines.push('=== SIMPLE KEYWORD TEST ===');
['pemahaman', 'paham', 'kelas', 'bagaimana', 'interaktif', 'performa', 'kepuasan'].forEach(kw => {
  const matches = headers.filter(h => h.toLowerCase().includes(kw));
  lines.push(`  "${kw}" matches ${matches.length} columns:`);
  matches.forEach(m => lines.push(`    ${JSON.stringify(m.substring(0, 60))}`));
});

// Now do the CORRECT analysis with proper column selection
const colP = headers.find(h => h.toLowerCase().includes('pemahaman'));
const colI = headers.find(h => h.toLowerCase().includes('interaktif'));
const colF = headers.find(h => h.toLowerCase().includes('performa'));

lines.push('');
lines.push(`CORRECT COLUMNS:`);
lines.push(`  P: ${JSON.stringify(colP?.substring(0,60))}`);
lines.push(`  I: ${JSON.stringify(colI?.substring(0,60))}`);
lines.push(`  F: ${JSON.stringify(colF?.substring(0,60))}`);

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

let valid = 0;
rawData.forEach(row => {
  const sP = colP ? parseScore(row[colP]) : null;
  const sI = colI ? parseScore(row[colI]) : null;
  const sF = colF ? parseScore(row[colF]) : null;
  if (sP !== null && sI !== null && sF !== null) valid++;
});

lines.push('');
lines.push(`VALID (all 3 scores): ${valid}`);
lines.push(`EXPECTED: 7201`);
lines.push(`MATCH: ${valid === 7201 ? 'YES!!! PERFECT MATCH!' : 'NO - diff=' + (valid - 7201)}`);

fs.writeFileSync('diagnose_result2.txt', lines.join('\n'), 'utf8');
console.log('Done');
