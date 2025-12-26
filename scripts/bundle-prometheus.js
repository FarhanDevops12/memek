import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi Path: Pastikan mengarah ke public/prometheus
const PROMETHEUS_DIR = path.join(__dirname, '../public/prometheus');
const OUTPUT_FILE = path.join(__dirname, '../public/prometheus-bundle.json');

function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) {
    console.error(`\n❌ ERROR FATAL: Folder tidak ditemukan: ${dirPath}`);
    process.exit(1); 
  }

  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.lua')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

console.log(`📦 Memulai Bundling Prometheus...`);

try {
  const allFiles = getAllFiles(PROMETHEUS_DIR);
  
  const bundle = allFiles.map(fullPath => {
    // GUNAKAN path.relative AGAR AMAN DI SEMUA OS (WINDOWS/LINUX)
    let relativePath = path.relative(PROMETHEUS_DIR, fullPath);
    
    // Ubah backslash Windows (\) jadi forward slash (/)
    relativePath = relativePath.replace(/\\/g, '/');

    const content = fs.readFileSync(fullPath, 'utf-8');
    
    return {
      path: relativePath,
      content: content
    };
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bundle));
  console.log(`✅ SUKSES! ${bundle.length} file Lua berhasil dibundle.`);

} catch (e) {
  console.error("❌ Gagal membundle:", e);
  process.exit(1);
}