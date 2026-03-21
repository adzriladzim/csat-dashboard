
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Use aoa_to_json or just access cells
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Array of arrays

    let countAllThree = 0;
    
    // Header is row 0.
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const p1 = row[15]; // Pemahaman
        const p2 = row[16]; // Interaktif
        const p3 = row[17]; // Performa
        const name = row[9]; // Dosen
        
        if (name && String(name).trim() !== '' && p1 && p2 && p3) {
            countAllThree++;
        }
    }

    console.log('Total Data Rows (excluding header):', rows.length - 1);
    console.log('Rows with content in columns 9, 15, 16, 17:', countAllThree);

} catch (err) {
    console.error('Error:', err.message);
}
