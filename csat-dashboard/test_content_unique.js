
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    const contentMap = new Map();
    let duplicateContent = 0;

    rows.forEach(r => {
        // Create a key based on all content EXCEPT timestamp
        const rCopy = { ...r };
        const h = Object.keys(r);
        const tsCol = h.find(c => c.toLowerCase().includes('timestamp'));
        if (tsCol) delete rCopy[tsCol];
        
        const key = JSON.stringify(rCopy).toLowerCase();
        if (contentMap.has(key)) {
            duplicateContent++;
        } else {
            contentMap.set(key, true);
        }
    });

    console.log('Total Rows:', rows.length);
    console.log('Rows with identical content (minus timestamp):', duplicateContent);
    console.log('Unique content rows:', rows.length - duplicateContent);

} catch (err) {
    console.error('Error:', err.message);
}
