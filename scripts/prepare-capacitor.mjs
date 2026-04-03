import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const webDir = path.join(rootDir, 'www');
const assetsToCopy = [
  'StudyHub.html',
  'app.js',
  'styles.css',
  'manifest.json',
  'sw.js',
  'assets',
];

rmSync(webDir, { recursive: true, force: true });
mkdirSync(webDir, { recursive: true });

for (const asset of assetsToCopy) {
  const sourcePath = path.join(rootDir, asset);
  const targetPath = path.join(webDir, asset);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing required asset: ${asset}`);
  }

  cpSync(sourcePath, targetPath, { recursive: true });
}

// Capacitor expects index.html as the web entry point. We mirror the main app
// screen there while still keeping StudyHub.html available for internal links.
const studyHubHtmlPath = path.join(rootDir, 'StudyHub.html');
const appEntryHtml = readFileSync(studyHubHtmlPath, 'utf8');
writeFileSync(path.join(webDir, 'index.html'), appEntryHtml);

console.log(`Prepared Capacitor web assets in ${webDir}`);
