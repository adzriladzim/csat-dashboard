
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    const yearCounts = {};
    rows.forEach(r => {
        const h = Object.keys(r);
        const col = h.find(c => c.toLowerCase().includes('timestamp'));
        const val = col ? String(r[col] || '').trim() : '';
        const yearMatch = val.match(/\d{4}/);
        const year = yearMatch ? yearMatch[0] : 'unknown';
        yearCounts[year] = (yearCounts[year] || 0) + 1;
    });

    console.log('Year counts:', yearCounts);

} catch (err) {
    console.error('Error:', err.message);
}
