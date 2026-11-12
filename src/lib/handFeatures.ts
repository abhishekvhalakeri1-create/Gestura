/**
 * Turns 21 raw landmarks into a small, rotatable, scale-free feature vector.
 *
 * The hand is re-expressed in its own palm frame (wrist at the origin, +y along
 * the middle metacarpal) so that a hand held at 45° produces the same numbers
 * as one held upright. Only the *side* the thumb sits on survives as a
 * chirality cue, which lets the classifier work for either hand.
 */

import type { Landmark, Vec2 } from '../types';
import { clamp } from './geometry';

export const LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

export type FingerKey = 'index' | 'middle' | 'ring' | 'pinky';

export const FINGER_KEYS: FingerKey[] = ['index', 'middle', 'ring', 'pinky'];

const FINGER_INDICES: Record<FingerKey, [number, number, number, number]> = {
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
};

const len = (x: number, y: number) => Math.hypot(x, y);

export interface HandFeatures {
  /** Finger extension, 0 = folded, 1 = straight. Order: index, middle, ring, pinky. */
  ext: [number, number, number, number];
  /** Thumb extension away from the CMC. */
  thumbReach: number;
  /** Thumb tip position along the palm's x axis in palm widths. */
  thumbX: number;
  /** How far the fingertips sit beyond the knuckle row. */
  tipDrop: number;
  /** Tip-to-tip gaps in palm widths: thumb↔index, thumb↔middle, index↔middle, middle↔ring, ring↔pinky. */
  gaps: [number, number, number, number, number];
  /** 1 = thumb and index point the same way, 0 = perpendicular. */
  indexThumbAngle: number;
  /** Aspect-corrected image-space anchor points, used for motion + coaching. */
  wrist: Vec2;
  palmCenter: Vec2;
  /** Palm length in aspect-corrected image units. */
  scale: number;
  /** Every landmark in palm-frame coordinates (palm widths, y up). */
  local: Vec2[];
}

/**
 * @param aspect videoWidth / videoHeight — landmarks are normalised per axis,
 * so x must be stretched before any distance is trustworthy.
 */
export function extractFeatures(landmarks: Landmark[], aspect = 1): HandFeatures | null {
  if (!landmarks || landmarks.length < 21) return null;

  const pts: Vec2[] = landmarks.map((p) => ({ x: p.x * aspect, y: p.y }));
  const wrist = pts[0];
  const midMcp = pts[9];
  const palmLength = len(midMcp.x - wrist.x, midMcp.y - wrist.y);
  if (palmLength < 1e-5) return null;

  const up = { x: (midMcp.x - wrist.x) / palmLength, y: (midMcp.y - wrist.y) / palmLength };
  const right = { x: -up.y, y: up.x };

  const toLocal = (p: Vec2): Vec2 => {
    const dx = p.x - wrist.x;
    const dy = p.y - wrist.y;
    return {
      x: (dx * right.x + dy * right.y) / palmLength,
      y: (dx * up.x + dy * up.y) / palmLength,
    };
  };

  const local = pts.map(toLocal);

  const ext = FINGER_KEYS.map((finger) => {
    const [mcp, pip, dip, tip] = FINGER_INDICES[finger];
    const reach = len(local[tip].x - local[mcp].x, local[tip].y - local[mcp].y);
    const segments =
      len(local[pip].x - local[mcp].x, local[pip].y - local[mcp].y) +
      len(local[dip].x - local[pip].x, local[dip].y - local[pip].y) +
      len(local[tip].x - local[dip].x, local[tip].y - local[dip].y);
    const straightness = segments > 1e-5 ? reach / segments : 0;
    const reachNorm = clamp((reach - 0.28) / (0.74 - 0.28));
    return clamp(0.78 * reachNorm + 0.22 * clamp((straightness - 0.55) / 0.45));
  }) as [number, number, number, number];

  const thumbTip = local[4];
  const thumbCmc = local[1];
  const thumbReachRaw = len(thumbTip.x - thumbCmc.x, thumbTip.y - thumbCmc.y);
  const thumbReach = clamp((thumbReachRaw - 0.3) / 0.55);

  const tipIndices = [8, 12, 16, 20];
  const mcpIndices = [5, 9, 13, 17];
  const tipDropRaw =
    tipIndices.reduce((sum, tip, i) => sum + (local[tip].y - local[mcpIndices[i]].y), 0) / 4;
  const tipDrop = clamp((tipDropRaw + 0.12) / 0.7, -0.3, 1.3);

  const gap = (a: number, b: number) =>
    len(local[a].x - local[b].x, local[a].y - local[b].y) / 1.2;

  const gaps: [number, number, number, number, number] = [
    gap(4, 8),
    gap(4, 12),
    gap(8, 12),
    gap(12, 16),
    gap(16, 20),
  ];

  const indexDir = {
    x: local[8].x - local[5].x,
    y: local[8].y - local[5].y,
  };
  const thumbDir = {
    x: thumbTip.x - thumbCmc.x,
    y: thumbTip.y - thumbCmc.y,
  };
  const indexLen = len(indexDir.x, indexDir.y) || 1;
  const thumbLen = len(thumbDir.x, thumbDir.y) || 1;
  const cosine =
    (indexDir.x * thumbDir.x + indexDir.y * thumbDir.y) / (indexLen * thumbLen);

  const palmCenter = {
    x: (local[0].x + local[5].x + local[9].x + local[13].x + local[17].x) / 5,
    y: (local[0].y + local[5].y + local[9].y + local[13].y + local[17].y) / 5,
  };

  return {
    ext,
    thumbReach,
    thumbX: thumbTip.x,
    tipDrop,
    gaps,
    indexThumbAngle: clamp((cosine + 1) / 2),
    wrist: { x: wrist.x, y: wrist.y },
    palmCenter: toImage(palmCenter, wrist, right, up, palmLength),
    scale: palmLength,
    local,
  };
}

function toImage(p: Vec2, origin: Vec2, right: Vec2, up: Vec2, scale: number): Vec2 {
  return {
    x: origin.x + (p.x * right.x + p.y * up.x) * scale,
    y: origin.y + (p.x * right.y + p.y * up.y) * scale,
  };
}

/** Flat numeric vector + matching weights, used by the nearest-template matcher. */
export const FEATURE_WEIGHTS = [
  1.15, 1.15, 1.15, 1.15, // finger extension
  0.55, // thumb reach
  1.2, // thumb x
  0.3, // tip drop (the least transferable feature between the rig and a real hand)
  0.85, // thumb ↔ index
  0.35, // thumb ↔ middle
  0.95, // index ↔ middle
  0.3, // middle ↔ ring
  0.2, // ring ↔ pinky
  0.5, // index/thumb angle
] as const;

export function featureVector(f: HandFeatures): number[] {
  return [
    f.ext[0],
    f.ext[1],
    f.ext[2],
    f.ext[3],
    f.thumbReach,
    f.thumbX,
    f.tipDrop,
    f.gaps[0],
    f.gaps[1],
    f.gaps[2],
    f.gaps[3],
    f.gaps[4],
    f.indexThumbAngle,
  ];
}
