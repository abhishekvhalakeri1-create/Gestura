/**
 * Renders every sign illustration into one validation sheet.
 * Dev-only; useful when tuning the hand rig.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { SIGNS } from '../src/data/signs';
import { buildHandDrawing, handDrawingToSvg } from '../src/lib/handSvg';

const cell = 220;
const columns = 7;
const rows = Math.ceil(SIGNS.length / columns);

const cells = SIGNS.map((sign, index) => {
  const x = (index % columns) * cell;
  const y = Math.floor(index / columns) * (cell + 26);
  const drawing = buildHandDrawing(sign.shape);
  const inner = handDrawingToSvg(drawing, { size: 190 }).replace(
    '<svg ',
    `<svg x="${15}" y="${10}" `,
  );
  return `<g transform="translate(${x}, ${y})">${inner}
    <text x="110" y="228" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#18181B">${sign.label}</text>
  </g>`;
}).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * cell}" height="${rows * (cell + 26)}" viewBox="0 0 ${columns * cell} ${rows * (cell + 26)}">
  <rect width="100%" height="100%" fill="#F7F5F0" />
  ${cells}
</svg>`;

const out = resolve('node_modules/.cache/hands.svg');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);
console.log(`wrote ${out} — ${columns * cell} x ${rows * (cell + 26)}`);
