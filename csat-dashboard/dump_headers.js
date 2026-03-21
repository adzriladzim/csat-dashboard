
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = rows[0];

    console.log('--- ALL UNIQUE HEADERS ---');
    headers.forEach((h, i) => {
        if (h) console.log(`${i}: ${h}`);
    });

} catch (err) {
    console.error('Error:', err.message);
}
