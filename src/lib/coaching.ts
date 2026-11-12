/**
 * Turns the difference between a live hand and a target handshape into plain
 * English. Practice mode shows at most two cues at a time so the learner is
 * never asked to fix five things at once.
 */

import type { HandFeatures } from './handFeatures';
import type { SignTemplate } from './classifier';
import { FINGER_KEYS } from './handFeatures';

const FINGER_WORDS: Record<string, string> = {
  index: 'index finger',
  middle: 'middle finger',
  ring: 'ring finger',
  pinky: 'pinky',
};

export interface Cue {
  id: string;
  text: string;
  /** 0..1 — how far off this particular element is. */
  severity: number;
}

export function coach(features: HandFeatures, template: SignTemplate): Cue[] {
  const target = template.features;
  const cues: Cue[] = [];

  FINGER_KEYS.forEach((finger, i) => {
    const delta = target.ext[i] - features.ext[i];
    if (Math.abs(delta) > 0.3) {
      cues.push({
        id: `finger-${finger}`,
        text:
          delta > 0
            ? `Straighten your ${FINGER_WORDS[finger]} a little more.`
            : `Curl your ${FINGER_WORDS[finger]} in towards your palm.`,
        severity: Math.min(1, Math.abs(delta)),
      });
    }
  });

  const thumbSide = features.thumbX - target.thumbX;
  if (Math.abs(thumbSide) > 0.28) {
    cues.push({
      id: 'thumb-side',
      text:
        thumbSide < 0
          ? 'Bring your thumb across the palm, closer to your fingers.'
          : 'Let your thumb move away from the palm, out to the side.',
      severity: Math.min(1, Math.abs(thumbSide) / 1.4),
    });
  }

  const thumbGap = features.gaps[0] - target.gaps[0];
  if (Math.abs(thumbGap) > 0.32) {
    cues.push({
      id: 'thumb-gap',
      text:
        thumbGap > 0
          ? 'Close the gap between your thumb and index fingertip.'
          : 'Open the space between your thumb and index finger.',
      severity: Math.min(1, Math.abs(thumbGap) / 1.6),
    });
  }

  const spread = features.gaps[2] - target.gaps[2];
  if (Math.abs(spread) > 0.42) {
    cues.push({
      id: 'spread',
      text:
        spread > 0
          ? 'Bring your index and middle fingers closer together.'
          : 'Let your index and middle fingers part into a wider V.',
      severity: Math.min(1, Math.abs(spread) / 1.8),
    });
  }

  if (features.ext.every((value) => value < 0.35) && target.ext.some((value) => value > 0.6)) {
    cues.push({
      id: 'too-curled',
      text: 'Your hand is reading as a fist — let the extended fingers relax open.',
      severity: 0.9,
    });
  }

  return cues.sort((a, b) => b.severity - a.severity).slice(0, 2);
}
