
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    const mkCounts = {};

    rows.forEach(r => {
        const h = Object.keys(r);
        const col = h.find(c => c.toLowerCase().includes('mata kuliah') && !c.toLowerCase().includes('faktor'));
        const val = col ? String(r[col] || '').trim() : '';
        mkCounts[val] = (mkCounts[val] || 0) + 1;
    });

    const sorted = Object.entries(mkCounts).sort((a,b) => b[1] - a[1]);
    console.log('Total MK found:', sorted.length);
    console.log('Distribution:', sorted);

} catch (err) {
    console.error('Error:', err.message);
}
