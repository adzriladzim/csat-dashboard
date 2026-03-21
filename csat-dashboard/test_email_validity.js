
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    let countInvalidEmail = 0;

    rows.forEach(r => {
        const h = Object.keys(r);
        const col = h.find(c => c.toLowerCase().includes('email address'));
        const val = col ? String(r[col] || '').trim().toLowerCase() : '';
        
        if (!val.includes('@') || val.length < 5) {
            countInvalidEmail++;
        }
    });

    console.log('Total Rows:', rows.length);
    console.log('Invalid Email Addresses (missing @ or too short):', countInvalidEmail);

} catch (err) {
    console.error('Error:', err.message);
}
