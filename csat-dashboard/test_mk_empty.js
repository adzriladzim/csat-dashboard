
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    let countEmptyMk = 0;
    rows.forEach(r => {
        const h = Object.keys(r);
        const mk1 = h.find(c => c === 'Mata Kuliah');
        const mk2 = h.find(c => c === 'Mata Kuliah 2');
        
        const v1 = mk1 ? String(r[mk1] || '').trim() : '';
        const v2 = mk2 ? String(r[mk2] || '').trim() : '';

        if (v1 === '' && v2 === '') countEmptyMk++;
    });

    console.log('Total Rows:', rows.length);
    console.log('Empty Mata Kuliah (both MK and MK 2):', countEmptyMk);

} catch (err) {
    console.error('Error:', err.message);
}
