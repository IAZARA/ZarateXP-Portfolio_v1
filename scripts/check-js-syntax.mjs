import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const ignoredDirs = new Set(['.git', 'node_modules', 'output']);

function listJavaScriptFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    if (ignoredDirs.has(entry.name)) return [];
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listJavaScriptFiles(fullPath);
    if (/\.(mjs|js)$/.test(entry.name)) return [fullPath];
    return [];
  });
}

const files = listJavaScriptFiles(root);
const failures = [];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    cwd: root,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    failures.push({
      file: path.relative(root, file),
      output: result.stderr || result.stdout
    });
  }
}

if (failures.length) {
  console.error('JavaScript syntax checks failed:');
  for (const failure of failures) {
    console.error(`\n${failure.file}`);
    console.error(failure.output.trim());
  }
  process.exit(1);
}

console.log(`JavaScript syntax checks passed: ${files.length}/${files.length}`);
