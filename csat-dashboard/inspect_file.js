
import XLSX from 'xlsx';
import path from 'path';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
    
    console.log('--- FILE INFO ---');
    console.log('Total Raw Rows:', rows.length);
    if (rows.length > 0) {
        console.log('Headers:', Object.keys(rows[0]));
        console.log('First 2 rows of data:');
        console.log(JSON.stringify(rows.slice(0, 2), null, 2));
        console.log('Last 2 rows of data:');
        console.log(JSON.stringify(rows.slice(-2), null, 2));
    }

    // Check for rows that might be filtered
    let countEmptyDosen = 0;
    let countNoScore = 0;
    rows.forEach((r, i) => {
        const headers = Object.keys(r);
        const nameCol = headers.find(h => h.toLowerCase().includes('nama dosen'));
        const nameVal = nameCol ? r[nameCol] : '';
        if (!nameVal || nameVal.trim() === '') countEmptyDosen++;
    });
    console.log('Rows with empty/missing Nama Dosen:', countEmptyDosen);

} catch (err) {
    console.error('Error:', err.message);
}
