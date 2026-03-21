
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    const headerSamples = {};

    rows.forEach(r => {
        Object.entries(r).forEach(([k, v]) => {
            if (v && v.toString().trim() !== '') {
                if (!headerSamples[k]) headerSamples[k] = v;
            }
        });
    });

    console.log('--- ALL COLUMNS AND SAMPLES ---');
    Object.entries(headerSamples).forEach(([k, v]) => {
        console.log(`HEADER: [${k}]`);
        console.log(`SAMPLE: [${v}]`);
        console.log('---');
    });

} catch (err) {
    console.error('Error:', err.message);
}
