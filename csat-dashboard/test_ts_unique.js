
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    const processed = rows.map(r => {
        const h = Object.keys(r);
        const getV = (kw) => {
            const c = h.find(col => col.toLowerCase().includes(kw.toLowerCase()));
            return c ? String(r[c] || '').trim() : '';
        };
        return {
            timestamp: getV('Timestamp')
        };
    });

    const uniqueMap = new Map();
    processed.forEach(r => {
        uniqueMap.set(r.timestamp, true);
    });

    console.log('Total Rows:', rows.length);
    console.log('Unique timestamps:', uniqueMap.size);

} catch (err) {
    console.error('Error:', err.message);
}
