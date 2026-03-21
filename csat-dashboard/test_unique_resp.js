
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    const processed = rows.map(r => {
        const h = Object.keys(r);
        const getV = (kw) => {
            const c = h.find(col => col.toLowerCase().includes(kw.toLowerCase()));
            return c ? String(r[c] || '').trim() : '';
        };
        return {
            email: getV('Email Address'),
            namaMhs: getV('Nama Mahasiswa'),
            dosen: getV('Nama Dosen'),
            matkul: getV('Mata Kuliah'),
            nim: getV('NIM')
        };
    });

    // Deduplicate by Student (Email/NIM/Name) + Dosen + Matkul
    const uniqueMap = new Map();
    let uniqueCount = 0;
    processed.forEach(r => {
        const identity = r.email || r.nim || r.namaMhs || 'anon';
        const key = `${identity}|${r.dosen}|${r.matkul}`.toLowerCase();
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, true);
            uniqueCount++;
        }
    });

    console.log('Total Rows:', rows.length);
    console.log('Unique responses (ignoring timestamp):', uniqueCount);

} catch (err) {
    console.error('Error:', err.message);
}
