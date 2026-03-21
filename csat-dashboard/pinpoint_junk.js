
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

    let countInvalid = 0;
    rows.forEach((r, i) => {
        const h = Object.keys(r);
        const getV = (kw) => {
            const c = h.find(col => col.toLowerCase().includes(kw.toLowerCase()));
            return c ? String(r[c] || '').trim() : '';
        };
        
        const d = getV('Nama Dosen');
        const p1 = parseScore(getV('tingkat pemahaman') || getV('materi'));
        const p2 = parseScore(getV('interaktif'));
        const p3 = parseScore(getV('performa') || getV('kepuasan'));

        const isValid = d !== '' && p1 !== null && p2 !== null && p3 !== null;
        if (!isValid) {
            countInvalid++;
            if (countInvalid <= 5) console.log(`Invalid row ${i}: Dosen="${d}", p1=${p1}, p2=${p2}, p3=${p3}`);
        }
    });

    console.log('Total Rows:', rows.length);
    console.log('Invalid Rows:', countInvalid);
    console.log('Target Valid:', rows.length - countInvalid);

} catch (err) {
    console.error('Error:', err.message);
}
