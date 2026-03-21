
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Use header: 1 to see all rows as arrays
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let realDataEndIndex = 0;
    for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i];
        // Check if row has more than 2 non-empty cells (Timestamp + Email aren't enough)
        const contentCount = row.filter(cell => cell && String(cell).trim() !== '').length;
        if (contentCount > 3) {
            realDataEndIndex = i;
            break;
        }
    }

    console.log('Total Rows in Sheet:', rows.length);
    console.log('Last row with significant data (index):', realDataEndIndex);
    console.log('Total rows of "Real Data":', realDataEndIndex); // Since 0 is header

} catch (err) {
    console.error('Error:', err.message);
}
