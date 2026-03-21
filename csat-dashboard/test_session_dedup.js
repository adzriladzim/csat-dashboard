
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
        const p1 = getV('paham');
        const p2 = getV('interaktif');
        const p3 = getV('performa');

        return {
            email: getV('Email Address'),
            dosen: getV('Nama Dosen'),
            pertemuan: getV('Pertemuan'),
            hasScores: (p1 !== '' && p2 !== '' && p3 !== '')
        };
    });

    const uniqueMap = new Map();
    let deduplicatedCount = 0;
    
    processed.forEach(r => {
        if (!r.hasScores) return; // Skip those first to see if it helps

        // KEY: Email + Lecturer + Session
        const key = `${r.email}|${r.dosen}|${r.pertemuan}`.toLowerCase();
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, true);
            deduplicatedCount++;
        }
    });

    console.log('Total Rows:', rows.length);
    console.log('Unique entries (Email, Dosen, Pertemuan) with scores:', deduplicatedCount);

} catch (err) {
    console.error('Error:', err.message);
}
