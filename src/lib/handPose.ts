/**
 * A tiny 2D hand rig.
 *
 * Every sign in Gestura is described as a `HandShape` — a duck-typed set of
 * joint curls, finger fans and a thumb abduction value. That single description
 * drives three things:
 *
 *   1. the vector illustration on each dictionary card,
 *   2. the recogniser's reference templates,
 *   3. the synthetic landmark stream used by the simulated feed.
 *
 * Keeping one source of truth is what stops the pictures and the recogniser
 * from quietly drifting apart.
 *
 * Coordinates are "palm frame": origin at the wrist, +y towards the fingertips,
 * +x towards the pinky, one unit ≈ one palm width.
 */

import { clamp, lerp, roundedPolygonPath } from './geometry';
import type { Vec2 } from '../types';

export type FingerName = 'index' | 'middle' | 'ring' | 'pinky';

export interface FingerPose {
  /** 0 = straight, 1 = fully folded into the palm. */
  curl: number;
  /** -1 = fanned inwards, 0 = neutral, 1 = fanned outwards. */
  spread: number;
}

export interface ThumbPose {
  /** 0 = tucked across the palm, 1 = abducted away from the index finger. */
  abduction: number;
  /** 0 = straight, 1 = curled towards the fingers. */
  curl: number;
}

export interface HandShape {
  index: FingerPose;
  middle: FingerPose;
  ring: FingerPose;
  pinky: FingerPose;
  thumb: ThumbPose;
  /** Purely cosmetic rotation of the illustration, in degrees (clockwise). */
  rotation?: number;
}

interface FingerRig {
  mcp: Vec2;
  baseAngle: number;
  lengths: [number, number, number];
  fan: -1 | 1;
  width: number;
}

const FINGER_RIGS: Record<FingerName, FingerRig> = {
  index: {
    mcp: { x: -0.19, y: 0.6 },
    baseAngle: -9,
    lengths: [0.33, 0.22, 0.16],
    fan: -1,
    width: 0.16,
  },
  middle: {
    mcp: { x: 0.02, y: 0.66 },
    baseAngle: -1,
    lengths: [0.36, 0.24, 0.17],
    // The middle finger fans away from the index, which is what opens a V.
    fan: 1,
    width: 0.17,
  },
  ring: {
    mcp: { x: 0.22, y: 0.6 },
    baseAngle: 9,
    lengths: [0.33, 0.22, 0.16],
    fan: 1,
    width: 0.155,
  },
  pinky: {
    mcp: { x: 0.39, y: 0.46 },
    baseAngle: 24,
    lengths: [0.26, 0.17, 0.12],
    fan: 1,
    width: 0.135,
  },
};

const THUMB_BASE: Vec2 = { x: -0.32, y: 0.2 };
const THUMB_LENGTHS: [number, number, number] = [0.25, 0.19, 0.15];

const PALM_OUTLINE: Vec2[] = [
  { x: -0.26, y: 0.0 },
  { x: -0.3, y: 0.16 },
  { x: -0.38, y: 0.3 },
  { x: -0.36, y: 0.44 },
  { x: -0.28, y: 0.56 },
  { x: -0.2, y: 0.64 },
  { x: -0.05, y: 0.7 },
  { x: 0.09, y: 0.71 },
  { x: 0.21, y: 0.65 },
  { x: 0.34, y: 0.55 },
  { x: 0.42, y: 0.42 },
  { x: 0.37, y: 0.18 },
  { x: 0.24, y: 0.02 },
  { x: 0.01, y: -0.03 },
];

export const FINGER_ORDER: FingerName[] = ['index', 'middle', 'ring', 'pinky'];

const rotate = (p: Vec2, deg: number): Vec2 => {
  const a = (deg * Math.PI) / 180;
  return {
    x: p.x * Math.cos(a) - p.y * Math.sin(a),
    y: p.x * Math.sin(a) + p.y * Math.cos(a),
  };
};

interface Chain {
  points: Vec2[];
  widths: number[];
}

function buildChain(
  origin: Vec2,
  baseAngle: number,
  lengths: [number, number, number],
  widths: [number, number, number],
  curl: number,
  bendDirection: 1 | -1,
): Chain {
  const points: Vec2[] = [origin];
  let angle = baseAngle;
  let cursor = origin;

  const foreshorten = [1 - 0.6 * curl, 1 - 0.7 * curl, 1 - 0.78 * curl];
  const bend = [52 * curl, 58 * curl, 50 * curl];

  for (let i = 0; i < 3; i += 1) {
    angle += bendDirection * bend[i];
    const rad = ((90 - angle) * Math.PI) / 180;
    const length = lengths[i] * foreshorten[i];
    cursor = {
      x: cursor.x + Math.cos(rad) * length,
      y: cursor.y + Math.sin(rad) * length,
    };
    points.push(cursor);
  }

  return { points, widths: [widths[0], widths[1], widths[2]] };
}

function fingerChain(name: FingerName, pose: FingerPose): Chain {
  const rig = FINGER_RIGS[name];
  const baseAngle = rig.baseAngle + rig.fan * pose.spread * 15;
  return buildChain(
    rig.mcp,
    baseAngle,
    rig.lengths,
    [rig.width, rig.width * 0.93, rig.width * 0.8],
    clamp(pose.curl),
    (-rig.fan) as 1 | -1,
  );
}

function thumbChain(pose: ThumbPose): Chain {
  const abduction = clamp(pose.abduction);
  const angle = 82 - 165 * abduction;
  return buildChain(
    THUMB_BASE,
    angle,
    THUMB_LENGTHS,
    [0.17, 0.145, 0.12],
    clamp(pose.curl),
    -1,
  );
}

export interface PosePart extends Chain {
  name: string;
}

export interface HandGeometry {
  /** 21 landmarks in palm frame, ordered exactly like MediaPipe's hand model. */
  points: Vec2[];
  palm: Vec2[];
  fingers: (PosePart & { finger: FingerName })[];
  thumb: PosePart;
  wrist: Vec2;
  shape: HandShape;
}

export function buildHandGeometry(shape: HandShape): HandGeometry {
  const rotation = shape.rotation ?? 0;

  const fingerChains = FINGER_ORDER.map((finger) => {
    const chain = fingerChain(finger, shape[finger]);
    return { ...chain, finger, name: finger };
  });

  const thumb = { ...thumbChain(shape.thumb), name: 'thumb' };

  const points: Vec2[] = [];
  points.push({ x: 0, y: 0 }); // 0 wrist
  points.push(...thumb.points); // 1-4
  fingerChains.forEach((chain) => points.push(...chain.points)); // 5-20

  const pivot = { x: 0.06, y: 0.34 };
  const applyRotation = (p: Vec2): Vec2 => {
    if (!rotation) return p;
    const r = rotate({ x: p.x - pivot.x, y: p.y - pivot.y }, rotation);
    return { x: r.x + pivot.x, y: r.y + pivot.y };
  };

  const mapPoints = (pts: Vec2[]) => pts.map(applyRotation);

  return {
    points: mapPoints(points),
    palm: mapPoints(PALM_OUTLINE),
    fingers: fingerChains.map((chain) => ({
      ...chain,
      points: mapPoints(chain.points),
      widths: [...chain.widths] as [number, number, number],
    })),
    thumb: { ...thumb, points: mapPoints(thumb.points), widths: [...thumb.widths] as [number, number, number] },
    wrist: applyRotation({ x: 0, y: 0 }),
    shape,
  };
}

export function poseBounds(geometry: HandGeometry) {
  const all = [...geometry.points, ...geometry.palm];
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/** Convert a palm-frame geometry to an SVG viewBox-local path set. */
export function geometryToSvgPaths(geometry: HandGeometry, padding = 0.1) {
  const bounds = poseBounds(geometry);
  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;
  const toSvg = (p: Vec2): Vec2 => ({
    x: p.x - bounds.minX + padding,
    y: height - (p.y - bounds.minY + padding),
  });

  const fingerPaths = [...geometry.fingers, geometry.thumb].map((part) => ({
    name: part.name,
    points: part.points.map(toSvg),
    widths: part.widths,
  }));

  return {
    width,
    height,
    palmPath: roundedPolygonPath(geometry.palm.map(toSvg), 0.075),
    fingers: fingerPaths,
    viewBox: `0 0 ${width.toFixed(3)} ${height.toFixed(3)}`,
  };
}

/** 21 landmarks in normalised image space — the same space MediaPipe returns. */
export function shapeToLandmarks(
  shape: HandShape,
  options: { cx?: number; cy?: number; size?: number } = {},
) {
  const { cx = 0.5, cy = 0.6, size = 0.44 } = options;
  const geometry = buildHandGeometry(shape);
  return geometry.points.map((p) => ({
    x: cx + p.x * size,
    y: cy - (p.y - 0.1) * size,
    z: 0,
  }));
}

export function interpolateShape(a: HandShape, b: HandShape, t: number): HandShape {
  const mix = clamp(t);
  const finger = (x: FingerPose, y: FingerPose): FingerPose => ({
    curl: lerp(x.curl, y.curl, mix),
    spread: lerp(x.spread, y.spread, mix),
  });

  return {
    index: finger(a.index, b.index),
    middle: finger(a.middle, b.middle),
    ring: finger(a.ring, b.ring),
    pinky: finger(a.pinky, b.pinky),
    thumb: {
      abduction: lerp(a.thumb.abduction, b.thumb.abduction, mix),
      curl: lerp(a.thumb.curl, b.thumb.curl, mix),
    },
  };
}

/** Nudge a synthetic pose so a simulated feed doesn't look mechanically frozen. */
export function jitterShape(shape: HandShape, amount: number): HandShape {
  const j = () => (Math.random() - 0.5) * 2 * amount;
  const finger = (x: FingerPose): FingerPose => ({
    curl: clamp(x.curl + j(), 0, 1),
    spread: clamp(x.spread + j() * 0.4, -1, 1),
  });
  return {
    index: finger(shape.index),
    middle: finger(shape.middle),
    ring: finger(shape.ring),
    pinky: finger(shape.pinky),
    thumb: {
      abduction: clamp(shape.thumb.abduction + j(), 0, 1),
      curl: clamp(shape.thumb.curl + j(), 0, 1),
    },
  };
}
