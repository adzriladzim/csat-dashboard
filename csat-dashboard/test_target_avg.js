
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

    let totalCsat = 0;
    let count = 0;

    rows.forEach(r => {
        const h = Object.keys(r);
        const getV = (kw) => {
            const c = h.find(col => col.toLowerCase().includes(kw.toLowerCase()));
            return c ? String(r[c] || '').trim() : '';
        };

        const p1 = parseScore(getV('tingkat pemahaman') || getV('materi'));
        const p2 = parseScore(getV('interaktif'));
        const p3 = parseScore(getV('performa') || getV('kepuasan'));

        if (p1 !== null && p2 !== null && p3 !== null) {
            const avg = (p1 + p2 + p3) / 3;
            totalCsat += avg;
            count++;
        }
    });

    console.log('Valid Count (All 3 scores):', count);
    console.log('Average CSAT:', (totalCsat / count).toFixed(3));

} catch (err) {
    console.error('Error:', err.message);
}
