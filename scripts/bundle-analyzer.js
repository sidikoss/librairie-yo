// scripts/bundle-analyzer.js
// Script d'analyse de la taille du bundle
// Usage: node scripts/bundle-analyzer.js

import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const THRESHOLDS = {
  critical: 50 * 1024,
  warning: 150 * 1024,
  ok: 300 * 1024,
};

const BYTE_UNITS = ['B', 'KB', 'MB'];

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${BYTE_UNITS[i]}`;
}

function getStatus(size) {
  if (size <= THRESHOLDS.critical) return { status: '✅ CRITICAL', color: '\x1b[32m' };
  if (size <= THRESHOLDS.warning) return { status: '⚠️ WARNING', color: '\x1b[33m' };
  if (size <= THRESHOLDS.ok) return { status: '✅ OK', color: '\x1b[32m' };
  return { status: '❌ TOO LARGE', color: '\x1b[31m' };
}

async function getFilesRecursive(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getFilesRecursive(fullPath);
      files.push(...subFiles);
    } else {
      const stats = await stat(fullPath);
      files.push({
        path: fullPath,
        size: stats.size,
        name: entry.name,
      });
    }
  }

  return files;
}

async function analyzeBundle() {
  console.log('\n📦 Bundle Analyzer — Librairie-YO\n');
  console.log('═'.repeat(60));

  try {
    const files = await getFilesRecursive(distDir);
    const assetsDir = join(distDir, 'assets');

    const jsFiles = files.filter(f => f.name.endsWith('.js') && f.path.includes('assets'));
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp|svg|ico)$/.test(f.name));
    const otherFiles = files.filter(f => !jsFiles.includes(f) && !cssFiles.includes(f) && !imageFiles.includes(f));

    const jsTotal = jsFiles.reduce((acc, f) => acc + f.size, 0);
    const cssTotal = cssFiles.reduce((acc, f) => acc + f.size, 0);
    const imageTotal = imageFiles.reduce((acc, f) => acc + f.size, 0);
    const otherTotal = otherFiles.reduce((acc, f) => acc + f.size, 0);
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    console.log('\n📊 RÉSUMÉ\n');
    console.log(`  Total des fichiers: ${files.length}`);
    console.log(`  Taille totale: ${formatBytes(totalSize)}`);
    console.log(`\n  ┌─────────────┬────────────┬────────┐`);
    console.log(`  │ Type        │ Taille     │ Fichiers │`);
    console.log(`  ├─────────────┼────────────┼────────┤`);
    console.log(`  │ JavaScript  │ ${formatBytes(jsTotal).padEnd(10)} │ ${String(jsFiles.length).padEnd(7)} │`);
    console.log(`  │ CSS         │ ${formatBytes(cssTotal).padEnd(10)} │ ${String(cssFiles.length).padEnd(7)} │`);
    console.log(`  │ Images      │ ${formatBytes(imageTotal).padEnd(10)} │ ${String(imageFiles.length).padEnd(7)} │`);
    console.log(`  │ Autres      │ ${formatBytes(otherTotal).padEnd(10)} │ ${String(otherFiles.length).padEnd(7)} │`);
    console.log(`  └─────────────┴────────────┴────────┘`);

    console.log('\n📈 PERFORMANCE ESTIMÉE\n');

    const { status: jsStatus, color } = getStatus(jsTotal);
    console.log(`  JavaScript: ${jsStatus} ${formatBytes(jsTotal)}`);
    if (jsTotal > THRESHOLDS.warning) {
      console.log(`    ⚡ Suggestion: Activer le code splitting plus fin`);
    }

    console.log('\n📁 FICHIERS JS (+50KB)\n');
    const largeJs = jsFiles.filter(f => f.size > 50 * 1024).sort((a, b) => b.size - a.size);

    if (largeJs.length === 0) {
      console.log('  ✅ Aucun fichier JS trop volumineux');
    } else {
      largeJs.forEach(f => {
        const { status, color } = getStatus(f.size);
        const relPath = relative(distDir, f.path);
        console.log(`  ${status} ${color}${formatBytes(f.size)}\x1b[0m ${relPath}`);
      });
    }

    console.log('\n📁 FICHIERS CSS\n');
    cssFiles.forEach(f => {
      const { status } = getStatus(f.size);
      const relPath = relative(distDir, f.path);
      console.log(`  ${status} ${formatBytes(f.size)} ${relPath}`);
    });

    console.log('\n📁 IMAGES\n');
    const largeImages = imageFiles.filter(f => f.size > 100 * 1024).sort((a, b) => b.size - a.size);

    if (largeImages.length === 0) {
      console.log('  ✅ Aucune image trop volumineuse');
    } else {
      largeImages.forEach(f => {
        const relPath = relative(distDir, f.path);
        console.log(`  ⚠️ ${formatBytes(f.size)} ${relPath}`);
      });
    }

    console.log('\n' + '═'.repeat(60));
    console.log('\n💡 RECOMMANDATIONS\n');

    if (jsTotal > THRESHOLDS.ok) {
      console.log('  ❌ JavaScript trop volumineux:');
      console.log('     → Activer le tree shaking');
      console.log('     → Optimiser les imports (lodash-es au lieu de lodash)');
      console.log('     → Utiliser dynamic imports pour les grosses librairies');
    }

    if (largeImages.length > 0) {
      console.log('  ❌ Images à optimiser:');
      largeImages.forEach(f => {
        const relPath = relative(distDir, f.path);
        console.log(`     → Convertir ${relPath} en WebP`);
      });
    }

    console.log('\n  ✅ Vérifier: npm run build puis npm run preview\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n  Exécutez d\'abord: npm run build');
  }

  console.log('\n');
}

analyzeBundle();