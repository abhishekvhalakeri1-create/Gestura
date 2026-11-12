/**
 * A synthetic hand for when there is no camera: same rig, same landmarks, same
 * recogniser. It walks through a short phrase letter by letter so the record
 * above can be explored end to end without granting camera access.
 */

import type { DetectedHand } from '../types';
import { SIGNS } from '../data/signs';
import { interpolateShape, jitterShape, shapeToLandmarks, type HandShape } from './handPose';
import { smoothstep } from './geometry';

const SEQUENCE = ['b', 'a', 'l', 'v', 'y', 'i', 'a', 'n', 'g', 'o', 'c', 'y'];
const HOLD_MS = 1900;
const MORPH_MS = 520;

const shapeFor = (id: string): HandShape =>
  SIGNS.find((sign) => sign.id === id)?.shape ?? SIGNS[1].shape;

export class DemoFeed {
  private startedAt = 0;
  private index = 0;

  reset(now: number) {
    this.startedAt = now;
    this.index = 0;
  }

  next(now: number): DetectedHand[] {
    if (this.startedAt === 0) this.reset(now);

    const elapsed = now - this.startedAt;
    const slot = HOLD_MS + MORPH_MS;
    const position = Math.floor(elapsed / slot);
    this.index = position % SEQUENCE.length;

    const within = elapsed % slot;
    const current = shapeFor(SEQUENCE[this.index]);
    const previous = shapeFor(SEQUENCE[(this.index - 1 + SEQUENCE.length) % SEQUENCE.length]);

    const morphing = within > HOLD_MS;
    const t = morphing ? smoothstep((within - HOLD_MS) / MORPH_MS) : 1;
    const blended = morphing ? interpolateShape(previous, current, t) : current;

    const breathe = Math.sin(now / 900) * 0.006;
    const sway = Math.sin(now / 1400) * 0.008;
    const shape = jitterShape(blended, 0.012);

    const landmarks = shapeToLandmarks(shape, {
      cx: 0.5 + sway,
      cy: 0.61 + breathe,
      size: 0.34,
    });

    return [
      {
        landmarks,
        handedness: 'Right',
        score: 0.98,
      },
    ];
  }
}
