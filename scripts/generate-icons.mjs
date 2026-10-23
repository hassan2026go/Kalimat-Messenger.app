import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
const svg = await readFile('icon.svg');
await mkdir('generated-icons', { recursive: true });
for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(`generated-icons/icon-${size}.png`);
}
await sharp(svg).resize(512, 512).png().toFile('generated-icons/icon-maskable-512.png');
await sharp(svg).resize(512, 512).png().toFile('generated-icons/icon.png');
console.log('Generated Kalimat feather icons at 192px and 512px.');
