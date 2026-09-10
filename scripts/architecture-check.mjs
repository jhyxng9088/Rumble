import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const sourceRoot = new URL('../src/', import.meta.url).pathname;
const forbiddenFileName = /(?:^|[-_.])patch\.(?:js|ts|tsx|jsx)$/i;
const forbiddenSourcePatterns = [
  ['MutationObserver', /\bMutationObserver\b/],
  ['synthetic DOM click', /\.click\s*\(/],
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const files = await walk(sourceRoot);
const violations = [];

for (const file of files) {
  const path = relative(sourceRoot, file);
  if (forbiddenFileName.test(path)) {
    violations.push(`${path}: patch-style file names are not allowed`);
  }

  if (!['.ts', '.tsx', '.js', '.jsx'].includes(extname(file))) continue;
  const source = await readFile(file, 'utf8');
  for (const [label, pattern] of forbiddenSourcePatterns) {
    if (pattern.test(source)) violations.push(`${path}: ${label} is not allowed`);
  }
}

if (violations.length) {
  console.error('Architecture guard failed:\n' + violations.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(`Architecture guard passed (${files.length} source files checked).`);
