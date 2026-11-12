/**
 * Framework-agnostic drawing description for the sign illustrations.
 *
 * The React component and the dev preview sheet both consume this so what we
 * check in tooling is literally what ships on the dictionary cards.
 */

import { SIGNS } from '../data/signs';
import { buildHandGeometry, type HandShape } from './handPose';
import { roundedPolygonPath } from './geometry';
import type { Vec2 } from '../types';

export interface HandPart {
  name: string;
  kind: 'finger' | 'thumb';
  /** Polyline through the finger joints, in SVG user units. */
  d: string;
  /** Body thickness in SVG user units. */
  width: number;
  tip: Vec2;
  /** True when the digit is folded back onto the palm instead of standing up. */
  folded: boolean;
}

export interface HandDrawing {
  width: number;
  height: number;
  viewBox: string;
  palmPath: string;
  parts: HandPart[];
}

interface Frame {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

let cachedFrame: Frame | null = null;

/**
 * The frame is built from the upright signs only, so every card shares one
 * scale. Rotated signs (G, H, P, Q) are then fitted inside it individually
 * rather than shrinking the whole alphabet.
 */
function computeFrame(): Frame {
  if (cachedFrame) return cachedFrame;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const sign of SIGNS) {
    if (sign.shape.rotation) continue;
    const geometry = buildHandGeometry(sign.shape);
    for (const point of [...geometry.points, ...geometry.palm]) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
  }

  const padding = 0.1;
  cachedFrame = {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding,
  };
  return cachedFrame;
}

const fmt = (n: number) => Number(n.toFixed(3));

export function buildHandDrawing(shape: HandShape): HandDrawing {
  const frame = computeFrame();
  const geometry = buildHandGeometry(shape);

  const width = frame.maxX - frame.minX;
  const height = frame.maxY - frame.minY;

  const all = [...geometry.points, ...geometry.palm];
  const minX = Math.min(...all.map((point) => point.x));
  const maxX = Math.max(...all.map((point) => point.x));
  const minY = Math.min(...all.map((point) => point.y));
  const maxY = Math.max(...all.map((point) => point.y));

  const boxWidth = maxX - minX || 1;
  const boxHeight = maxY - minY || 1;
  const fit = Math.min(1, (width * 0.95) / boxWidth, (height * 0.95) / boxHeight);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const toSvg = (p: Vec2): Vec2 => ({
    x: width / 2 + (p.x - centerX) * fit,
    y: height / 2 - (p.y - centerY) * fit,
  });

  const parts: HandPart[] = [...geometry.fingers, geometry.thumb].map((part) => {
    const points = part.points.map(toSvg);

    // A finger curled almost flat onto the palm collapses into a stub no longer
    // than its own width, which reads as a shapeless lump on a card. Push the
    // drawn tip a little further along its last segment so closed fingers stay
    // recognisable as fingers — the geometry used for matching is untouched.
    const tip = points[points.length - 1];
    const base = points[0];
    const reach = Math.hypot(tip.x - base.x, tip.y - base.y);
    const folded = part.name !== 'thumb' && reach < 0.36;

    if (folded) {
      const prev = points[points.length - 2] ?? base;
      const len = Math.hypot(tip.x - prev.x, tip.y - prev.y) || 1;
      const lift = (0.36 - reach) * 0.95 * fit;
      tip.x += ((tip.x - prev.x) / len) * lift;
      tip.y += ((tip.y - prev.y) / len) * lift;
    }

    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${fmt(p.x)} ${fmt(p.y)}`)
      .join(' ');

    return {
      name: part.name,
      kind: part.name === 'thumb' ? 'thumb' : 'finger',
      d,
      width: Math.max(0.09, part.widths[0] * (folded ? 1.16 : 0.94) * fit),
      tip: points[points.length - 1],
      folded,
    };
  });

  return {
    width,
    height,
    viewBox: `0 0 ${fmt(width)} ${fmt(height)}`,
    palmPath: roundedPolygonPath(geometry.palm.map(toSvg), 0.07 * fit),
    parts,
  };
}

/** Standalone SVG markup — used by tooling and the social preview. */
export function handDrawingToSvg(
  drawing: HandDrawing,
  options: { body?: string; outline?: string; size?: number; palmTone?: string } = {},
): string {
  const {
    body = '#F1EBE1',
    outline = '#CFC6B4',
    size = 220,
    palmTone = '#E3DACA',
  } = options;
  const height = (size * drawing.height) / drawing.width;

  const standing = drawing.parts.filter((part) => !part.folded);
  const folded = drawing.parts.filter((part) => part.folded);

  const stroke = (part: HandPart, tone: string, extra: number) =>
    `<path d="${part.d}" fill="none" stroke="${tone}" stroke-width="${(part.width + extra).toFixed(3)}" stroke-linecap="round" stroke-linejoin="round" />`;

  // The silhouette is built in layers: a fat underlay of every shape gives one
  // continuous outline, then the palm and standing fingers are filled in two
  // tones. Folded fingers sit on top with their own hairline so a closed fist
  // still reads as four distinct knuckles rather than a single lump.
  const outlinePass = [drawing.palmPath, ...standing.map((part) => part.d)]
    .map((d, index) =>
      index === 0
        ? `<path d="${d}" stroke-width="0.085" />`
        : `<path d="${d}" stroke-width="${(standing[index - 1].width + 0.085).toFixed(3)}" />`,
    )
    .join('');

  const palmPass = `<path d="${drawing.palmPath}" fill="${palmTone}" stroke="${palmTone}" stroke-width="0.001" />`;
  const standingPass = standing.map((part) => stroke(part, body, 0)).join('');

  const foldedPass = folded
    .map((part) => stroke(part, outline, 0.075) + stroke(part, body, 0))
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${drawing.viewBox}" width="${size}" height="${height}">
  <g fill="${outline}" stroke="${outline}" stroke-linejoin="round" stroke-linecap="round">${outlinePass}</g>
  ${palmPass}
  <g>${standingPass}</g>
  <g>${foldedPass}</g>
</svg>`;
}

export const HAND_DIAGRAM_INK = '#18181B';
