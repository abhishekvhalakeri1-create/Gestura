import { rankVector } from '../src/lib/classifier';

/** Feature vectors captured from real ASL photos with MediaPipe (see README). */
const SAMPLES: Record<string, { letter: string; vector: number[] }> = {
  B: { letter: 'b', vector: [1.0, 1.0, 1.0, 1.0, 1.0, -0.05, 1.3, 0.84, 0.95, 0.25, 0.23, 0.35, 0.98] },
  L: { letter: 'l', vector: [1.0, 0.16, 0.18, 0.1, 1.0, -1.14, 0.16, 1.43, 0.96, 1.19, 0.17, 0.17, 0.72] },
  Y: { letter: 'y', vector: [0.29, 0.38, 0.29, 1.0, 1.0, -1.27, -0.02, 1.02, 1.21, 0.19, 0.15, 1.16, 0.07] },
  V: { letter: 'v', vector: [1.0, 1.0, 0.0, 0.0, 0.88, -0.22, 0.59, 0.94, 0.82, 0.57, 1.04, 0.13, 0.79] },
  W: { letter: 'w', vector: [1.0, 1.0, 1.0, 0.0, 0.99, -0.21, 1.12, 0.95, 0.91, 0.41, 0.38, 0.95, 0.86] },
  A: { letter: 'a', vector: [0.0, 0.04, 0.1, 0.0, 1.0, 0.48, -0.19, 0.59, 0.74, 0.18, 0.18, 0.17, 0.0] },
};

let failures = 0;

for (const [name, sample] of Object.entries(SAMPLES)) {
  const flip = [...sample.vector];
  flip[5] = -flip[5];
  const a = rankVector(sample.vector);
  const b = rankVector(flip);
  const best = a[0].confidence >= b[0].confidence ? a : b;
  const ok = best[0].entry.id === sample.letter && best[0].confidence >= 0.72;
  if (!ok) failures += 1;

  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${name}  top=${best[0].entry.label} ${(best[0].confidence * 100).toFixed(0)}%`,
    ` next=${best[1].entry.label} ${(best[1].confidence * 100).toFixed(0)}%`,
    ` margin=${(best[0].confidence - best[1].confidence).toFixed(2)}`,
  );
}

console.log(`\nreal-photo failures ${failures}/${Object.keys(SAMPLES).length}`);
process.exit(failures > 0 ? 1 : 0);
