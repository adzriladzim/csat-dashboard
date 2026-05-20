import fs from 'fs';

const filePath = 'd:/TWM KERJAAN/csat-dashboard-fullstack/csat-dashboard/src/components/pages/RankingPage.jsx';

try {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('<ExportMenu')) {
      console.log(`Line ${idx + 1}:`);
      for (let i = Math.max(0, idx - 5); i < Math.min(lines.length, idx + 10); i++) {
        console.log(`  ${i + 1}: ${lines[i]}`);
      }
    }
  });
} catch (err) {
  console.error(err);
}
