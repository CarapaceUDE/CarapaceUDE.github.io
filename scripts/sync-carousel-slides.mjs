import { readFile, writeFile } from 'node:fs/promises';

const deckUrl = new URL('../ideas/index.html', import.meta.url);
const outputUrl = new URL('../src/deck-slides.generated.js', import.meta.url);
const html = await readFile(deckUrl, 'utf8');
const match = html.match(/const slides = (\[[\s\S]*?\]);/);

if (!match) throw new Error('Could not find the slide data in ideas/index.html');

const deckSlides = JSON.parse(match[1]);
const slides = deckSlides.map(({ n, title, img }) => ({
  number: n,
  title,
  image: `ideas/${img}`
}));

if (!slides.length || slides.some((slide) => !slide.number || !slide.title || !slide.image)) {
  throw new Error('The /ideas/ deck contains incomplete slide metadata');
}

const output = `// Generated from /ideas/index.html by scripts/sync-carousel-slides.mjs.\n` +
  `// Edit the deck source, then run npm run build:carousel.\n` +
  `export const slides = ${JSON.stringify(slides, null, 2)};\n`;

await writeFile(outputUrl, output, 'utf8');
console.log(`Synced ${slides.length} homepage slides from /ideas/.`);
