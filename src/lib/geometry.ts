/** Small, dependency-free maths helpers used by the geometry and renderer. */

import type { Vec2 } from '../types';

export const clamp = (value: number, min = 0, max = 1) =>
  value < min ? min : value > max ? max : value;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const distance = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);

export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });

export const scale = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });

export const normalize = (a: Vec2 & { z?: number }): Vec2 => {
  const length = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / length, y: a.y / length };
};

export const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y;

export const midpoint = (a: Vec2, b: Vec2): Vec2 => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

export const degToRad = (deg: number) => (deg * Math.PI) / 180;
export const radToDeg = (rad: number) => (rad * 180) / Math.PI;

/** Angle of a direction vector in degrees, measured from the positive x axis. */
export const angleOf = (a: Vec2) => radToDeg(Math.atan2(a.y, a.x));

/** Smoothstep easing, used for pose morphs in the simulated feed. */
export const smoothstep = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

/** Rounded-corner polygon path, in SVG coordinates. */
export function roundedPolygonPath(points: Vec2[], radius: number): string {
  if (points.length < 3) return '';
  const n = points.length;
  const parts: string[] = [];

  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const toPrev = normalize(sub(prev, curr));
    const toNext = normalize(sub(next, curr));
    const r = Math.min(radius, distance(prev, curr) / 2, distance(next, curr) / 2);

    const start = add(curr, scale(toPrev, r));
    const end = add(curr, scale(toNext, r));

    parts.push(
      i === 0 ? `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}` : `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    );
    parts.push(
      `Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    );
  }

  parts.push('Z');
  return parts.join(' ');
}

export function formatPercent(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}
