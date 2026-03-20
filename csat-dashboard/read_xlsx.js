import * as XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
  const result = {
    headers: data[0],
    sampleRows: data.slice(1, 3)
  };
  
  fs.writeFileSync('d:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/xlsx_debug.json', JSON.stringify(result, null, 2));
  console.log('Done writing debug info.');
} catch (e) {
  console.error(e);
}
