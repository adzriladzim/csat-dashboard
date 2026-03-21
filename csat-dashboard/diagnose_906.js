import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

let ganjilCount = 0;
const courseGanjil = new Map();

rawData.forEach(row => {
  const sem = String(row['Semester Berjalan'] || '').toLowerCase();
  if (sem.includes('ganjil') || sem.includes('i') || sem.includes('iii')) {
     if (!sem.includes('ii') && !sem.includes('iv') && !sem.includes('vi')) {
        ganjilCount++;
        const mk = row['Mata Kuliah'] || row['Mata Kuliah 2'] || 'Unknown';
        courseGanjil.set(mk, (courseGanjil.get(mk) || 0) + 1);
     }
  }
});

const lines = [];
lines.push(`Total Ganjil detected: ${ganjilCount}`);
lines.push(`\nCourses with Ganjil entries:`);
[...courseGanjil.entries()].sort((a,b) => b[1]-a[1]).forEach(([mk, c]) => {
  lines.push(`  ${c}: ${mk}`);
});

fs.writeFileSync('diagnose_906.txt', lines.join('\n'), 'utf8');
console.log('Done');
