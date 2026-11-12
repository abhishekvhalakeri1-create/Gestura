/**
 * A nearest-template handshape recogniser.
 *
 * Every recognised sign has one canonical pose. At runtime we project both the
 * live hand and the canonical poses into the same 13-dimensional anatomical
 * feature space and measure a weighted Euclidean distance. The nearest
 * template wins; the distance is mapped to a confidence that the UI treats as
 * "how sure am I that this is the hand you're making".
 *
 * This is deliberately a geometric model rather than a black box: every number
 * traces back to a joint angle or a fingertip gap, which is what lets the
 * practice mode tell a learner *which finger* is out of place.
 */

import { STATIC_SIGNS, type SignEntry } from '../data/signs';
import {
  FEATURE_WEIGHTS,
  extractFeatures,
  featureVector,
  type HandFeatures,
} from './handFeatures';
import { shapeToLandmarks, type HandShape } from './handPose';
import { clamp } from './geometry';

export interface SignTemplate {
  entry: SignEntry;
  features: HandFeatures;
  vector: number[];
}

/**
 * Confidence falls off as a Gaussian over feature distance. Tuned so a
 * canonical pose reads ~100%, a tidy real hand lands in the 80s, and a hand
 * that is only roughly the right shape fades below 50%.
 */
const SIGMA = 0.45;

const toConfidence = (distance: number) => Math.exp(-((distance / SIGMA) ** 2));
const THUMB_X_FEATURE = 5;

function canonicalFeatures(shape: HandShape): HandFeatures | null {
  const upright: HandShape = { ...shape, rotation: 0 };
  const landmarks = shapeToLandmarks(upright, { cx: 0.5, cy: 0.62, size: 0.42 });
  return extractFeatures(landmarks, 1);
}

export const SHAPE_TEMPLATES: SignTemplate[] = STATIC_SIGNS.flatMap((entry) => {
  const features = canonicalFeatures(entry.shape);
  if (!features) return [];
  return [{ entry, features, vector: featureVector(features) }];
});

function weightedDistance(a: number[], b: number[]): number {
  let sum = 0;
  let weightSum = 0;

  for (let i = 0; i < a.length; i += 1) {
    const weight = FEATURE_WEIGHTS[i] ?? 1;
    const delta = a[i] - b[i];
    sum += weight * delta * delta;
    weightSum += weight;
  }

  return Math.sqrt(sum / weightSum);
}

/**
 * Templates are drawn for a right hand. Feeding a left hand through unchanged
 * mirrors every thumb position, so each frame picks exactly one chirality —
 * the one whose best template matches most closely — and uses it throughout.
 * Choosing per-template instead would let near-miss shapes win on the wrong
 * mirror and flatten the ranking.
 */
function orient(features: HandFeatures): number[] {
  const vector = featureVector(features);
  const mirrored = [...vector];
  mirrored[THUMB_X_FEATURE] = -mirrored[THUMB_X_FEATURE];

  const bestFor = (candidate: number[]) =>
    Math.min(...SHAPE_TEMPLATES.map((template) => weightedDistance(candidate, template.vector)));

  return bestFor(vector) <= bestFor(mirrored) ? vector : mirrored;
}

export interface ShapeReading {
  entry: SignEntry;
  confidence: number;
  distance: number;
}

export function classifyShape(features: HandFeatures): ShapeReading[] {
  return rankVector(orient(features));
}

/** Ranks every template against an already-extracted feature vector. */
export function rankVector(vector: number[]): ShapeReading[] {
  return SHAPE_TEMPLATES.map((template) => {
    const distance = weightedDistance(vector, template.vector);
    return {
      entry: template.entry,
      distance,
      confidence: clamp(toConfidence(distance)),
    };
  }).sort((a, b) => b.confidence - a.confidence);
}

export function templateFor(signId: string): SignTemplate | undefined {
  return SHAPE_TEMPLATES.find((template) => template.entry.id === signId);
}

/** Similarity against one specific sign, used by practice mode. */
export function similarityTo(features: HandFeatures, signId: string): number {
  const template = templateFor(signId);
  if (!template) return 0;
  const distance = weightedDistance(orient(features), template.vector);
  return clamp(toConfidence(distance));
}
