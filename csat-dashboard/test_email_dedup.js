
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
            dosen: getVal('Nama Dosen'),
            mk: getVal('Mata Kuliah'),
            timestamp: getVal('Timestamp')
        };
    });

    const uniqueMap = new Map();
    let duplicates = 0;
    processed.forEach(r => {
        const key = `${r.email}|${r.dosen}|${r.mk}`.toLowerCase();
        if (uniqueMap.has(key)) {
            duplicates++;
        } else {
            uniqueMap.set(key, true);
        }
    });

    console.log('Total Rows:', rows.length);
    console.log('Duplicates found by (Email + Dosen + MK):', duplicates);
    console.log('Unique Rows:', rows.length - duplicates);

} catch (err) {
    console.error('Error:', err.message);
}
