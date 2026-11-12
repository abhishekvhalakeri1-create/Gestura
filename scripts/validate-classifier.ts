/**
 * Dev-only sanity harness: renders every canonical sign pose, pushes it back
 * through the recogniser and reports how cleanly the templates separate.
 *
 *   npx esbuild scripts/validate-classifier.ts --bundle --platform=node \
 *     --format=esm --outfile=/tmp/validate.mjs && node /tmp/validate.mjs
 */
import { STATIC_SIGNS } from '../src/data/signs';
import { classifyShape, SHAPE_TEMPLATES } from '../src/lib/classifier';
import { featureVector, extractFeatures } from '../src/lib/handFeatures';
import { shapeToLandmarks } from '../src/lib/handPose';

const NAMES = ['ext.i', 'ext.m', 'ext.r', 'ext.p', 'thbR', 'thbX', 'drop', 'g.TI', 'g.TM', 'g.IM', 'g.MR', 'g.RP', 'ang'];

const header = ['sign', ...NAMES].join('\t');
console.log(header);
for (const template of SHAPE_TEMPLATES) {
  console.log(
    [template.entry.label, ...template.vector.map((v) => v.toFixed(2))].join('\t'),
  );
}

console.log('\n--- self-recognition (canonical pose in, top 3 out) ---');
let failures = 0;
let totalConfidence = 0;

for (const sign of STATIC_SIGNS) {
  const features = extractFeatures(
    shapeToLandmarks({ ...sign.shape, rotation: 0 }, { cx: 0.5, cy: 0.62, size: 0.42 }),
    1,
  );
  if (!features) {
    console.log(`${sign.label}: feature extraction failed`);
    continue;
  }
  const readings = classifyShape(features);
  const top = readings[0];
  const self = readings.find((r) => r.entry.id === sign.id)!;
  const ok = top.entry.id === sign.id;
  if (!ok) failures += 1;
  totalConfidence += self.confidence;
  const rank = readings.findIndex((r) => r.entry.id === sign.id) + 1;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${sign.label.padEnd(3)} top=${top.entry.label.padEnd(6)} ${(
      top.confidence * 100
    ).toFixed(0)}%  self=${(self.confidence * 100).toFixed(0)}% rank=${rank}  next=${readings[1].entry.label} ${(
      readings[1].confidence * 100
    ).toFixed(0)}%  alt=${readings[2]?.entry.label} ${(readings[2]?.confidence * 100).toFixed(0)}%`,
  );
}

console.log(`\nfailures ${failures}/${STATIC_SIGNS.length}  mean self confidence ${((totalConfidence / STATIC_SIGNS.length) * 100).toFixed(1)}%`);

console.log('\n--- closest template pairs ---');
const pairs: { a: string; b: string; d: number }[] = [];
for (let i = 0; i < SHAPE_TEMPLATES.length; i += 1) {
  for (let j = i + 1; j < SHAPE_TEMPLATES.length; j += 1) {
    const va = featureVector(SHAPE_TEMPLATES[i].features);
    const vb = featureVector(SHAPE_TEMPLATES[j].features);
    let sum = 0;
    for (let k = 0; k < va.length; k += 1) sum += (va[k] - vb[k]) ** 2;
    pairs.push({ a: SHAPE_TEMPLATES[i].entry.label, b: SHAPE_TEMPLATES[j].entry.label, d: Math.sqrt(sum / va.length) });
  }
}
pairs
  .sort((x, y) => x.d - y.d)
  .slice(0, 12)
  .forEach((p) => console.log(`${p.a} ↔ ${p.b}: ${p.d.toFixed(3)}`));

console.log('\n--- noise robustness (±0.06 on every feature, 40 trials per sign) ---');
let noisyOk = 0;
let noisyTotal = 0;
for (const sign of STATIC_SIGNS) {
  const base = extractFeatures(
    shapeToLandmarks({ ...sign.shape, rotation: 0 }, { cx: 0.5, cy: 0.62, size: 0.42 }),
    1,
  );
  if (!base) continue;
  const vector = featureVector(base);
  for (let trial = 0; trial < 40; trial += 1) {
    const jittered = vector.map((v) => v + (Math.random() - 0.5) * 0.12);
    const fake = {
      ...base,
      ext: [jittered[0], jittered[1], jittered[2], jittered[3]] as [number, number, number, number],
      thumbReach: jittered[4],
      thumbX: jittered[5],
      tipDrop: jittered[6],
      gaps: [jittered[7], jittered[8], jittered[9], jittered[10], jittered[11]] as [number, number, number, number, number],
      indexThumbAngle: jittered[12],
    };
    noisyTotal += 1;
    if (classifyShape(fake)[0].entry.id === sign.id) noisyOk += 1;
  }
}
console.log(`noisy accuracy ${((noisyOk / noisyTotal) * 100).toFixed(1)}%`);
