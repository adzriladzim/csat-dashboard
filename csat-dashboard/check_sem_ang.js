
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    const semCounts = {};
    const angCounts = {};

    rows.forEach(r => {
        const h = Object.keys(r);
        const sCol = h.find(c => c.toLowerCase().includes('semester'));
        const aCol = h.find(c => c.toLowerCase().includes('angkatan'));
        
        const sVal = sCol ? String(r[sCol] || '').trim() : '';
        const aVal = aCol ? String(r[aCol] || '').trim() : '';

        semCounts[sVal] = (semCounts[sVal] || 0) + 1;
        angCounts[aVal] = (angCounts[aVal] || 0) + 1;
    });

    console.log('Semester counts:', semCounts);
    console.log('Angkatan counts:', angCounts);

} catch (err) {
    console.error('Error:', err.message);
}
