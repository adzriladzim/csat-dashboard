import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Load package.json
const pkgPath = path.resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

// Get args
const type = process.argv[2]; // 'fix' or 'feat'
const message = process.argv[3];

if (!type || !['fix', 'feat'].includes(type)) {
  console.error('❌ Error: Type must be "fix" or "feat"');
  process.exit(1);
}

if (!message) {
  console.error('❌ Error: Please provide a commit message. Example: npm run fix "fixed pdf header"');
  process.exit(1);
}

// SemVer Logic
let [major, minor, patch] = pkg.version.split('.').map(Number);
if (type === 'fix') patch++;
if (type === 'feat') { minor++; patch = 0; }
const newVersion = `${major}.${minor}.${patch}`;

// Update package.json
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`✅ Version bumped: ${newVersion}`);

// Git Commands
try {
  console.log('🚀 Running Git commands...');
  execSync('git add .');
  execSync(`git commit -m "${type}: ${message} (v${newVersion})"`);
  console.log('📦 Commited successfully.');
  
  // Optional: Auto push
  // execSync('git push'); 
  // console.log('📤 Pushed to GitHub.');
  
  console.log(`\n🎉 Release ${newVersion} is ready!`);
  console.log(`👉 Next step: git push`);
} catch (error) {
  console.error('❌ Git Error:', error.message);
  process.exit(1);
}
