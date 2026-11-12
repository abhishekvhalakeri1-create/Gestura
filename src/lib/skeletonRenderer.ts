/**
 * The overlay. Deliberately not MediaPipe's stock drawing utils: nodes are
 * delicate translucent dots, bones are 1.5px hairlines, and the whole hand
 * only warms to vermilion once the reading is genuinely confident.
 *
 * Landmarks arrive at ~30fps while the canvas runs at display refresh, so the
 * renderer eases towards the latest detection. That decoupling is what keeps
 * the overlay from stuttering on slower machines.
 */

import type { DetectedHand } from '../types';

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

const FINGERTIPS = new Set([4, 8, 12, 16, 20]);

interface SmoothedHand {
  points: { x: number; y: number }[];
  active: number;
}

export interface SkeletonStyle {
  mirrored: boolean;
  /** 0..1 — drives the vermilion warmth. */
  emphasis: number;
  nodeRadius?: number;
  lineWidth?: number;
}

export interface SkeletonRenderer {
  resize: (width: number, height: number, dpr: number) => void;
  setHands: (hands: DetectedHand[]) => void;
  draw: (style: SkeletonStyle, dt: number) => void;
  clear: () => void;
}

export function createSkeletonRenderer(
  canvas: HTMLCanvasElement,
  videoSize: { width: number; height: number },
): SkeletonRenderer {
  let width = 0;
  let height = 0;
  let dpr = 1;
  let hands: SmoothedHand[] = [];

  const ease = 0.28;

  function resize(nextWidth: number, nextHeight: number, nextDpr: number) {
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = Math.round(nextWidth * nextDpr);
    canvas.height = Math.round(nextHeight * nextDpr);
  }

  function setHands(next: DetectedHand[]) {
    if (next.length !== hands.length) {
      hands = next.map((hand) => ({
        points: hand.landmarks.map((p) => ({ x: p.x, y: p.y })),
        active: 0,
      }));
      return;
    }

    hands = hands.map((hand, index) => ({
      active: hand.active,
      points: hand.points.map((point, i) => {
        const target = next[index]?.landmarks[i];
        if (!target) return point;
        // Normalised space is 0..1, so a fixed lerp is resolution independent.
        return {
          x: point.x + (target.x - point.x) * ease,
          y: point.y + (target.y - point.y) * ease,
        };
      }),
    }));
  }

  function project(point: { x: number; y: number }) {
    const vw = videoSize.width || 1280;
    const vh = videoSize.height || 720;
    const scale = Math.max(width / vw, height / vh);
    const drawWidth = vw * scale;
    const drawHeight = vh * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    const x = point.x * drawWidth + offsetX;
    const y = point.y * drawHeight + offsetY;
    return { x, y };
  }

  function draw(style: SkeletonStyle, _dt: number) {
    const ctx = canvas.getContext('2d');
    if (!ctx || width === 0) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (hands.length === 0) return;

    const emphasis = Math.max(0, Math.min(1, style.emphasis));
    const nodeRadius = style.nodeRadius ?? 4;
    const lineWidth = style.lineWidth ?? 1.5;

    const boneAlpha = 0.34 + emphasis * 0.42;
    const nodeAlpha = 0.55 + emphasis * 0.4;

    for (const hand of hands) {
      const points = hand.points.map((point) => {
        const projected = project(point);
        return style.mirrored ? { x: width - projected.x, y: projected.y } : projected;
      });

      // A whisper of a palm fill keeps the bones reading as a hand rather than
      // a constellation of dots.
      ctx.save();
      ctx.beginPath();
      [0, 5, 9, 13, 17].forEach((index, i) => {
        if (i === 0) ctx.moveTo(points[index].x, points[index].y);
        else ctx.lineTo(points[index].x, points[index].y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
      ctx.fill();
      ctx.restore();

      // Soft halo when the reading is confident — warmth, not neon.
      if (emphasis > 0.55) {
        ctx.save();
        ctx.globalAlpha = (emphasis - 0.55) * 0.32;
        ctx.strokeStyle = '#D94E34';
        ctx.lineWidth = lineWidth + 4;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(217, 78, 52, 0.6)';
        ctx.shadowBlur = 9;
        for (const [a, b] of HAND_CONNECTIONS) {
          ctx.beginPath();
          ctx.moveTo(points[a].x, points[a].y);
          ctx.lineTo(points[b].x, points[b].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle =
        emphasis > 0.5
          ? `rgba(244, 208, 197, ${boneAlpha})`
          : `rgba(255, 255, 255, ${boneAlpha})`;
      ctx.beginPath();
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.moveTo(points[a].x, points[a].y);
        ctx.lineTo(points[b].x, points[b].y);
      }
      ctx.stroke();
      ctx.restore();

      ctx.save();
      for (let i = 0; i < points.length; i += 1) {
        const isTip = FINGERTIPS.has(i);
        const radius = isTip ? nodeRadius + 0.5 : nodeRadius;

        // A darker rim keeps the nodes legible over bright backgrounds.
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, radius + 0.9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(18, 18, 20, 0.28)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, radius, 0, Math.PI * 2);
        const warmth = emphasis > 0.5 ? 0.85 + emphasis * 0.15 : 1;
        ctx.fillStyle = isTip
          ? `rgba(255, 255, 255, ${nodeAlpha})`
          : `rgba(255, 255, 255, ${nodeAlpha * warmth * 0.86})`;
        if (emphasis > 0.7 && isTip) {
          ctx.shadowColor = 'rgba(217, 78, 52, 0.65)';
          ctx.shadowBlur = 7;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }
  }

  function clear() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    hands = [];
  }

  return { resize, setHands, draw, clear };
}
