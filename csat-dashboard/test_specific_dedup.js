
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
            email: getV('Email Address'),
            dosen: getV('Nama Dosen'),
            pertemuan: getV('pertemuan')
        };
    });

    // Deduplicate by (Email, Dosen, Pertemuan)
    const uniqueMap = new Map();
    let uniqueCount = 0;
    processed.forEach(r => {
        const key = `${r.email}|${r.dosen}|${r.pertemuan}`.toLowerCase();
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, true);
            uniqueCount++;
        }
    });

    console.log('Total Rows:', rows.length);
    console.log('Unique (Email, Dosen, Pertemuan):', uniqueCount);

} catch (err) {
    console.error('Error:', err.message);
}
