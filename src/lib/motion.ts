/**
 * Conversational gestures live in movement, not in a frozen handshape: a wave,
 * a nodding fist, a circle on the chest. This tracker keeps a short trail of
 * palm positions and hand openness, then looks for the shapes those gestures
 * leave behind.
 *
 * Everything is intentionally conservative — a false positive that types
 * "Hello" while the user is just repositioning their hand is much worse than
 * asking them to wave again.
 */

import type { DetectedHand, DetectedSign } from '../types';
import { clamp } from './geometry';
import { extractFeatures } from './handFeatures';

interface Sample {
  t: number;
  x: number;
  y: number;
  open: number;
  pinch: number;
}

const WINDOW_MS = 950;

function reversals(series: number[], minAmplitude: number): number {
  if (series.length < 4) return 0;

  let direction = 0;
  let extreme = series[0];
  let count = 0;

  for (let i = 1; i < series.length; i += 1) {
    const value = series[i];
    const delta = value - extreme;

    if (direction === 0) {
      if (Math.abs(delta) >= minAmplitude) {
        direction = Math.sign(delta);
        extreme = value;
        count += 1;
      }
      continue;
    }

    if (Math.sign(delta) === -direction && Math.abs(delta) >= minAmplitude) {
      direction = -direction;
      count += 1;
    }
    if (Math.sign(delta) !== -direction) {
      if ((value - extreme) * direction > 0) extreme = value;
    }
  }

  return count;
}

function span(series: number[]): number {
  if (series.length === 0) return 0;
  return Math.max(...series) - Math.min(...series);
}

export class MotionTracker {
  private trails: Sample[][] = [[], []];
  private circlePhases: { last: number; swept: number; center: { x: number; y: number } }[] = [
    { last: 0, swept: 0, center: { x: 0.5, y: 0.5 } },
    { last: 0, swept: 0, center: { x: 0.5, y: 0.5 } },
  ];

  reset() {
    this.trails = [[], []];
  }

  update(hands: DetectedHand[], aspect: number, now: number): DetectedSign | null {
    while (this.trails.length < Math.max(2, hands.length)) {
      this.trails.push([]);
    }

    const samples: Sample[] = [];

    hands.slice(0, 2).forEach((hand, index) => {
      const features = extractFeatures(hand.landmarks, aspect);
      if (!features) {
        samples[index] = { t: now, x: 0.5, y: 0.5, open: 0, pinch: 0 };
        return;
      }

      const open =
        features.ext.reduce((sum, value) => sum + value, 0) / features.ext.length;
      const sample: Sample = {
        t: now,
        x: features.palmCenter.x / aspect,
        y: features.palmCenter.y,
        open,
        pinch: features.gaps[0],
      };

      samples[index] = sample;
      const trail = this.trails[index];
      trail.push(sample);
      while (trail.length > 2 && now - trail[0].t > WINDOW_MS) trail.shift();
    });

    if (hands.length === 0) {
      this.reset();
      return null;
    }

    const candidates: DetectedSign[] = [];

    this.trails.forEach((trail, index) => {
      if (trail.length < 6) return;
      const current = trail[trail.length - 1];
      const xs = trail.map((s) => s.x);
      const ys = trail.map((s) => s.y);
      const meanOpen = trail.reduce((sum, s) => sum + s.open, 0) / trail.length;

      const candidate = (id: string, label: string, confidence: number) => {
        candidates.push({ id, label, confidence, via: 'motion' });
      };

      // HELLO — an open palm swinging side to side.
      const xSwings = reversals(xs, 0.028);
      if (meanOpen > 0.62 && xSwings >= 2 && span(xs) > 0.055) {
        candidate('hello', 'Hello', clamp(0.7 + xSwings * 0.05, 0.7, 0.94));
      }

      // YES — a fist nodding at the wrist.
      const yNods = reversals(ys, 0.02);
      if (meanOpen < 0.42 && yNods >= 2 && span(ys) > 0.035) {
        candidate('yes', 'Yes', clamp(0.68 + yNods * 0.05, 0.68, 0.92));
      }

      // NO — index and middle tapping the thumb, or a fist shaking sideways.
      // Taps are the easiest gesture to fire by accident (any handshape change
      // moves the pinch gap), so the bar is deliberately high.
      const taps = reversals(
        trail.map((s) => s.pinch),
        0.3,
      );
      if (taps >= 3 && meanOpen > 0.28 && meanOpen < 0.68 && span(xs) < 0.06) {
        candidate('no', 'No', clamp(0.68 + taps * 0.04, 0.68, 0.9));
      } else if (meanOpen < 0.42 && xSwings >= 2 && span(xs) > 0.045) {
        candidate('no', 'No', 0.74);
      }

      // PLEASE — a flat palm circling against the chest.
      const state = this.circlePhases[index] ?? { last: 0, swept: 0, center: { ...current } };
      const dx = current.x - state.center.x;
      const dy = current.y - state.center.y;
      const angle = Math.atan2(dy, dx);
      if (state.last !== 0) {
        let delta = angle - state.last;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        if (Math.hypot(dx, dy) < 0.12) state.swept += Math.abs(delta);
      }
      state.last = angle;
      state.center.x += (current.x - state.center.x) * 0.06;
      state.center.y += (current.y - state.center.y) * 0.06;
      this.circlePhases[index] = state;

      if (meanOpen > 0.6 && state.swept > 3.6) {
        candidate('please', 'Please', clamp(0.68 + state.swept * 0.02, 0.7, 0.9));
        state.swept = 0;
      }
      if (meanOpen > 0.6 && Math.hypot(dx, dy) > 0.1) {
        state.swept = Math.max(0, state.swept - 0.05);
      }

      // THANK YOU — a flat hand travelling forward and down from the chin.
      const first = trail[0];
      const descent = current.y - first.y;
      if (meanOpen > 0.6 && descent > 0.07 && span(ys) < 0.16) {
        candidate('thank-you', 'Thank you', clamp(0.66 + descent * 1.4, 0.66, 0.9));
      }
    });

    const twoHand = detectTwoHandGesture(hands, aspect);
    if (twoHand) candidates.push(twoHand);

    return candidates.reduce<DetectedSign | null>(
      (leader, entry) => (!leader || entry.confidence > leader.confidence ? entry : leader),
      null,
    );
  }
}

/** HELP — a fist resting on the open palm beneath it. */
export function detectTwoHandGesture(
  hands: DetectedHand[],
  aspect: number,
): DetectedSign | null {
  if (hands.length < 2) return null;

  const profiles = hands.slice(0, 2).map((hand) => {
    const features = extractFeatures(hand.landmarks, aspect);
    if (!features) return null;
    const open = features.ext.reduce((sum, value) => sum + value, 0) / features.ext.length;
    return { open, x: features.palmCenter.x, y: features.palmCenter.y };
  });

  if (profiles.some((profile) => profile === null)) return null;
  const [a, b] = profiles as { open: number; x: number; y: number }[];

  const fist = a.open < b.open ? a : b;
  const palm = a.open < b.open ? b : a;

  const vertical = palm.y - fist.y;
  const horizontal = Math.abs(palm.x - fist.x);

  if (palm.open > 0.62 && fist.open < 0.5 && vertical > 0.03 && vertical < 0.22 && horizontal < 0.2) {
    return {
      id: 'help',
      label: 'Help',
      confidence: clamp(0.7 + vertical * 0.6 + (0.2 - horizontal), 0.7, 0.92),
      via: 'motion',
    };
  }

  return null;
}
