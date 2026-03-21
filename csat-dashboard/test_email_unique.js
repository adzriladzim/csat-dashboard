
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    const processed = rows.map(r => {
        const h = Object.keys(r);
        const getVal = (kw) => {
            const c = h.find(col => col.toLowerCase().includes(kw.toLowerCase()));
            return c ? (r[c] || '').trim() : '';
        }
        return {
            email: getVal('Email Address'),
            timestamp: getVal('Timestamp'),
            dosen: getVal('Nama Dosen')
        };
    });

    // Deduplication by Email + Dosen (Keep only latest by Timestamp)
    // Actually, in the same XLSX, rows are usually chronological.
    // Let's see the count of unique (Email, Dosen) pairs.
    const uniqueMap = new Map();
    processed.forEach(r => {
        const key = `${r.email}|${r.dosen}`.toLowerCase();
        uniqueMap.set(key, true);
    });

    console.log('Total Rows:', rows.length);
    console.log('Unique (Email, Dosen) pairs:', uniqueMap.size);

} catch (err) {
    console.error('Error:', err.message);
}
