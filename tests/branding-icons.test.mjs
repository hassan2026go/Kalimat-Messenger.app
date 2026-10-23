import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [svg, manifestText, html, app, workflow, generator] = await Promise.all([
  readFile(new URL('../icon.svg', import.meta.url), 'utf8'),
  readFile(new URL('../manifest.json', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/build-apk.yml', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/generate-icons.mjs', import.meta.url), 'utf8')
]);
const manifest = JSON.parse(manifestText);

test('Kalimat icon is real vector artwork, not the old checkerboard placeholder', () => {
  assert.match(svg, /viewBox="0 0 512 512"/);
  assert.match(svg, /feather/i);
  assert.match(svg, /speech bubble/i);
  assert.match(svg, /linearGradient/);
  assert.match(svg, /<path/);
  assert.doesNotMatch(svg, /checkerboard|transparency grid/i);
});

test('web app and manifest use the vector Kalimat logo', () => {
  assert.match(html, /href="icon\.svg"/);
  assert.match(app, /src: 'icon\.svg'/);
  assert.ok(manifest.icons.some(icon => icon.src === 'icon.svg' && icon.type === 'image/svg+xml'));
});

test('Android build rasterizes the same vector artwork before generating native launcher icons', () => {
  assert.match(workflow, /node scripts\/generate-icons\.mjs/);
  assert.match(workflow, /cp generated-icons\/icon\.png assets\/icon\.png/);
  assert.match(workflow, /cp icon\.svg www\//);
  assert.match(generator, /\[192, 512\]/);
  assert.match(generator, /generated-icons\/icon-\$\{size\}\.png/);
  assert.match(generator, /icon-maskable-512\.png/);
});
