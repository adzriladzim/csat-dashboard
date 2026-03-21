
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { raw: false, header: 1 });
    const headers = rawRows[0];

    console.log('--- ALL HEADERS ---');
    headers.forEach((h, i) => {
        if (h && (h.toLowerCase().includes('paham') || h.toLowerCase().includes('dosen') || h.toLowerCase().includes('mata kuliah'))) {
            console.log(`${i}: ${h}`);
        }
    });

} catch (err) {
    console.error('Error:', err.message);
}
