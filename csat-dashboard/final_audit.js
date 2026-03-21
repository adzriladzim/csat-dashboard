
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    function parseScore(val) {
        if (!val) return null
        const m = String(val).trim().match(/^\((\d+(?:\.\d+)?)\)/)
        if (m) { const n = parseFloat(m[1]); if (!isNaN(n) && n >= 1 && n <= 5) return n }
        const n = parseFloat(String(val))
        return (!isNaN(n) && n >= 1 && n <= 5) ? n : null
    }

    let results = {
      allThreeMissing: 0,
      anyOneMissing: 0, 
      junkDosen: 0,
      testRows: 0,
      duplicateContent: 0,
      invalidTimestamp: 0
    };

    const contentMap = new Map();

    rows.forEach(r => {
        const h = Object.keys(r);
        const getV = (kw) => {
            const c = h.find(col => col.toLowerCase().includes(kw.toLowerCase()));
            return c ? String(r[c] || '').trim() : '';
        };

        const p1 = parseScore(getV('tingkat pemahaman') || getV('materi'));
        const p2 = parseScore(getV('interaktif'));
        const p3 = parseScore(getV('performa') || getV('kepuasan'));
        const d = getV('Nama Dosen');
        const ts = getV('Timestamp');
        const email = getV('Email');
        const mhs = getV('Mahasiswa');

        if (p1 === null && p2 === null && p3 === null) results.allThreeMissing++;
        if (p1 === null || p2 === null || p3 === null) results.anyOneMissing++;
        
        if (['.','-','..','none','test'].includes(d.toLowerCase())) results.junkDosen++;
        if (mhs.toLowerCase().includes('test') || email.toLowerCase().includes('test')) results.testRows++;
        
        const dateObj = new Date(ts);
        if (isNaN(dateObj)) results.invalidTimestamp++;

        const rCopy = { ...r };
        const tsCol = h.find(c => c.toLowerCase().includes('timestamp'));
        if (tsCol) delete rCopy[tsCol];
        const key = JSON.stringify(rCopy).toLowerCase();
        if (contentMap.has(key)) results.duplicateContent++;
        else contentMap.set(key, true);
    });

    console.log('Total Rows:', rows.length);
    console.log('Audit Results:', results);

} catch (err) {
    console.error('Error:', err.message);
}
