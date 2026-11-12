/**
 * Copies the MediaPipe vision WASM runtime out of node_modules and into
 * `public/mediapipe/wasm` so Gestura can boot without reaching a third-party
 * CDN. Runs automatically before `npm run dev` and `npm run build`.
 *
 * If the copy is unavailable the app falls back to jsDelivr at runtime.
 */
import { cp, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const target = join(root, 'public', 'mediapipe', 'wasm');

const FILES = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
];

try {
  await access(source);
} catch {
  console.warn('[assets] @mediapipe/tasks-vision is not installed yet — skipping WASM copy.');
  process.exit(0);
}

await mkdir(target, { recursive: true });

for (const file of FILES) {
  try {
    await cp(join(source, file), join(target, file));
  } catch {
    console.warn(`[assets] could not copy ${file}`);
  }
}

console.log('[assets] MediaPipe WASM runtime ready in public/mediapipe/wasm');
