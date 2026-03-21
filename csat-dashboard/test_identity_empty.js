
import XLSX from 'xlsx';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/Blok A _ Form Feedback Perkuliahan - Semester Genap 2025_2026 (Jawaban) (6).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    let countEmptyEmail = 0;
    let countEmptyName = 0;
    let countEmptyNim = 0;
    let countAnyEmptyIdentity = 0;

    rows.forEach(r => {
        const h = Object.keys(r);
        const getV = (kw) => {
            const c = h.find(col => col.toLowerCase().includes(kw.toLowerCase()));
            return c ? String(r[c] || '').trim() : '';
        };
        const email = getV('Email Address');
        const name = getV('Nama Mahasiswa');
        const nim = getV('NIM');

        if (email === '') countEmptyEmail++;
        if (name === '') countEmptyName++;
        if (nim === '') countEmptyNim++;
        if (email === '' && name === '' && nim === '') countAnyEmptyIdentity++;
    });

    console.log('Total Rows:', rows.length);
    console.log('Empty Email:', countEmptyEmail);
    console.log('Empty Name:', countEmptyName);
    console.log('Empty NIM:', countEmptyNim);
    console.log('Completely Anonymous (No Email/Name/NIM):', countAnyEmptyIdentity);

} catch (err) {
    console.error('Error:', err.message);
}
