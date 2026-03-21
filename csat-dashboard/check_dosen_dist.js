
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    const dosenCounts = {};

    rows.forEach(r => {
        const h = Object.keys(r);
        const nameCol = h.find(col => col.toLowerCase().includes('nama dosen'));
        const nameVal = nameCol ? String(r[nameCol] || '').trim() : '';

        dosenCounts[nameVal] = (dosenCounts[nameVal] || 0) + 1;
    });

    const sorted = Object.entries(dosenCounts).sort((a,b) => b[1] - a[1]);
    console.log('Total lecturers found:', sorted.length);
    console.log('Top 10 lecturers by response count:');
    console.log(sorted.slice(0, 10));
    console.log('Bottom 10 lecturers by response count:');
    console.log(sorted.slice(-10));

    // Check if any lecturer has EXACTLY 43 responses or if there's a weird one
    const suspect = sorted.find(s => s[1] === 43 || s[0].length < 3);
    if (suspect) console.log('Suspect found:', suspect);

} catch (err) {
    console.error('Error:', err.message);
}
