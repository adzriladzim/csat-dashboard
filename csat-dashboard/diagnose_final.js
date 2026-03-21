import XLSX from 'xlsx';
import fs from 'fs';

const file1 = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';
const workbook = XLSX.readFile(file1);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const lines = [];

// 1. Check for specific common rejection reasons
const tests = [
  { name: 'NIM matches Nama Mahasiswa', fn: (r) => String(r['NIM']).toLowerCase() === String(r['Nama Mahasiswa']).toLowerCase() },
  { name: 'Nama Mahasiswa matches Nama Dosen', fn: (r) => String(r['Nama Mahasiswa']).toLowerCase() === String(r['Nama Dosen']).toLowerCase() },
  { name: 'Gmail and Short NIM', fn: (r) => String(r['Email Address']).includes('gmail') && String(r['NIM']).length < 5 },
  { name: 'Blank Pertemuan but has Score', fn: (r) => !r['Pertemuan ke'] && r[Object.keys(r).find(h => h.includes('pemahaman'))] },
  { name: 'Score is 0 or > 5', fn: (r) => { 
      const s = r[Object.keys(r).find(h => h.includes('pemahaman'))];
      return s === 0 || s > 5;
    }},
];

tests.forEach(t => {
  let count = 0;
  rawData.forEach(r => { if (t.fn(r)) count++; });
  lines.push(`${t.name}: ${count} ${count === 43 ? '<<< MATCH!' : ''}`);
});

// 2. Try the "Duplicate" key: Email + Dosen + Pertemuan + Timestamp
// Very often feedback is submitted twice at the same time
const byTsEmailDosen = new Map();
let dupByTED = 0;
rawData.forEach(r => {
  const key = `${r['Timestamp']}|${r['Email Address']}|${r['Nama Dosen']}`.toLowerCase();
  if (byTsEmailDosen.has(key)) dupByTED++;
  else byTsEmailDosen.set(key, true);
});
lines.push(`Duplicates (Ts+Email+Dosen): ${dupByTED}`);

// 3. Check for specific "Block B" rows that might be filtered out
// In Block B, these columns might be empty or different
let blockBEmptyScores = 0;
rawData.forEach(row => {
   // If it's Block B, maybe the score headers are different?
   // No, we already checked all columns.
});

// 4. Check for rows where "NIM" contains letters (not pure numeric)
let alphaNim = 0;
rawData.forEach(r => {
  const nim = String(r['NIM'] ?? '').trim();
  if (/[a-zA-Z]/.test(nim)) alphaNim++;
});
lines.push(`NIM contains letters: ${alphaNim}`);

// 5. Check for rows where "Pertemuan ke" is not a number
let nonNumPertemuan = 0;
rawData.forEach(r => {
  const p = String(r['Pertemuan ke'] ?? '').trim();
  if (p && isNaN(parseInt(p))) nonNumPertemuan++;
});
lines.push(`Non-numeric Pertemuan: ${nonNumPertemuan}`);

// 6. Check for rows where "NIM" is exactly some length
for(let len=1; len<20; len++) {
  let count = 0;
  rawData.forEach(r => { if (String(r['NIM'] ?? '').trim().length === len) count++; });
  if (count > 0) lines.push(`NIM length ${len}: ${count} ${count === 43 ? '<<< MATCH!' : ''}`);
}

// 7. Check for rows where "Angkatan" is empty
let emptyAngkatan = 0;
rawData.forEach(r => { if (!String(r['Angkatan Perkuliahan'] ?? '').trim()) emptyAngkatan++; });
lines.push(`Empty Angkatan: ${emptyAngkatan} ${emptyAngkatan === 43 ? '<<< MATCH!' : ''}`);

// 8. Check for rows where "Fakultas" is empty
let emptyFakultas = 0;
rawData.forEach(r => { if (!String(r['Fakultas'] ?? '').trim()) emptyFakultas++; });
lines.push(`Empty Fakultas: ${emptyFakultas} ${emptyFakultas === 43 ? '<<< MATCH!' : ''}`);

fs.writeFileSync('diagnose_final.txt', lines.join('\n'), 'utf8');
console.log('Done');
