
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    const pertemuanCounts = {};

    rows.forEach(r => {
        const h = Object.keys(r);
        const col = h.find(c => c.toLowerCase().includes('pertemuan'));
        const val = col ? String(r[col] || '').trim() : '';
        pertemuanCounts[val] = (pertemuanCounts[val] || 0) + 1;
    });

    console.log('Pertemuan counts:', pertemuanCounts);

} catch (err) {
    console.error('Error:', err.message);
}
