import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// Keep the committed Pages files directly runnable, with one content-derived
// version on every local stylesheet/module URL (including transitive imports).
const names = ['index.html', 'app.js', 'interface.js', 'history.js', 'calculations.js', 'storage.js', 'styles.css'];
const references = /(['"])(\.\/[^'"?]+\.(?:js|css))(?:\?v=[a-f0-9]{12})?\1/g;
const files = await Promise.all(names.map(async name => {
  const url = new URL(`../docs/${name}`, import.meta.url);
  const source = (await readFile(url, 'utf8')).replaceAll('\r\n', '\n');
  return { name, url, source, normalized: source.replace(references, '$1$2$1') };
}));
const version = createHash('sha256').update(files.map(file => `${file.name}\n${file.normalized}`).join('\n')).digest('hex').slice(0, 12);
const stale = [];
for (const file of files) {
  const expected = file.normalized.replace(references, (_, quote, path) => `${quote}${path}?v=${version}${quote}`);
  if (expected === file.source) continue;
  stale.push(file.name);
  if (process.argv.includes('--write')) await writeFile(file.url, expected);
}
if (stale.length && !process.argv.includes('--write')) {
  console.error(`Asset URLs are stale in ${stale.join(', ')}. Run npm run version:assets and commit the updated URLs.`);
  process.exitCode = 1;
} else console.log(`Asset version ${version}${stale.length ? ` updated in ${stale.length} files` : ' verified'}.`);
