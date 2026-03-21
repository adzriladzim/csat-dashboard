import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
const headers = Object.keys(rawData[0]).filter(h => h.length < 50); // Avoid long question headers

const lines = [];

// Try all pairs of columns
for (let i = 0; i < headers.length; i++) {
  for (let j = i + 1; j < headers.length; j++) {
    const counts = new Map();
    let dups = 0;
    rawData.forEach(row => {
      const key = `${row[headers[i]]}|${row[headers[j]]}`.toLowerCase();
      if (counts.has(key)) dups++;
      else counts.set(key, true);
    });
    if (dups === 43) lines.push(`[MATCH 43] Key: "${headers[i]}" + "${headers[j]}"`);
  }
}

// Try all triples
if (lines.length === 0) {
  for (let i = 0; i < headers.length; i++) {
    for (let j = i + 1; j < headers.length; j++) {
      for (let k = j + 1; k < headers.length; k++) {
        const counts = new Map();
        let dups = 0;
        rawData.forEach(row => {
          const key = `${row[headers[i]]}|${row[headers[j]]}|${row[headers[k]]}`.toLowerCase();
          if (counts.has(key)) dups++;
          else counts.set(key, true);
        });
        if (dups === 43) lines.push(`[MATCH 43] Key: "${headers[i]}" + "${headers[j]}" + "${headers[k]}"`);
      }
    }
  }
}

fs.writeFileSync('diagnose_brute.txt', lines.join('\n'), 'utf8');
console.log('Done');
