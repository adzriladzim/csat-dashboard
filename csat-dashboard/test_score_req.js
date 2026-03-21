
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

    let countAllThree = 0;
    let countAtLeastOne = 0;
    
    rows.forEach(r => {
        const h = Object.keys(r);
        const getV = (kw) => {
            const c = h.find(col => col.toLowerCase().includes(kw.toLowerCase()));
            return c ? r[c] : '';
        };
        const p1 = parseScore(getV('tingkat pemahaman') || getV('materi'));
        const p2 = parseScore(getV('Interaktif yang dimaksud') || getV('interaktif'));
        const p3 = parseScore(getV('kepuasan kamu terhadap performa') || getV('performa') || getV('kepuasan'));
        
        if (p1 !== null && p2 !== null && p3 !== null) countAllThree++;
        if (p1 !== null || p2 !== null || p3 !== null) countAtLeastOne++;
    });

    console.log('Total Rows:', rows.length);
    console.log('Rows with all 3 scores:', countAllThree);
    console.log('Rows with at least 1 score:', countAtLeastOne);

} catch (err) {
    console.error('Error:', err.message);
}
