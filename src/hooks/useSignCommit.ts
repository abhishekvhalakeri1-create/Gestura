import { useEffect, useRef, useState } from 'react';
import type { DetectedSign, RecognitionFrame } from '../types';
import { CONFIG } from '../lib/config';

interface Options {
  subscribe: (listener: (frame: RecognitionFrame) => void) => () => void;
  enabled: boolean;
  dwellMs: number;
  onCommit: (sign: DetectedSign) => void;
}

export interface SignCommitState {
  /** 0..1, written every frame — read it from rAF, not from React. */
  progressRef: React.MutableRefObject<number>;
  readingId: string | null;
  readingLabel: string | null;
  /** True once a sign has been committed and is still being held. */
  locked: boolean;
}

/**
 * Dwell logic, deliberately outside React.
 *
 * A letter is committed only when the same reading survives for `dwellMs`.
 * After a commit the sign stays locked until the hand is released, so holding a
 * letter does not spray it into the transcript. Motion gestures bypass the
 * dwell entirely — they are momentary by nature — and get a cooldown instead.
 */
export function useSignCommit({ subscribe, enabled, dwellMs, onCommit }: Options): SignCommitState {
  const progressRef = useRef(0);
  const holdRef = useRef<{ id: string; since: number } | null>(null);
  const lockedRef = useRef<string | null>(null);
  const lastTsRef = useRef(0);
  const lastViableRef = useRef(0);
  const cadenceRef = useRef(0);
  const lastMotionRef = useRef(0);
  const commitRef = useRef(onCommit);
  const dwellRef = useRef(dwellMs);
  const [reading, setReading] = useState<{ id: string; label: string } | null>(null);
  const [locked, setLocked] = useState(false);

  commitRef.current = onCommit;
  dwellRef.current = dwellMs;

  useEffect(() => {
    if (!enabled) {
      holdRef.current = null;
      lockedRef.current = null;
      progressRef.current = 0;
      lastTsRef.current = 0;
      setReading(null);
      setLocked(false);
      return;
    }

    const setLabel = (next: { id: string; label: string } | null) =>
      setReading((current) => {
        if (current?.id === next?.id) return current;
        return next;
      });

    return subscribe((frame) => {
      const now = frame.ts;
      // Dwell is wall-clock, not a sum of per-frame deltas: on a slow machine a
      // dozen-frame hold would otherwise take far longer than the ring
      // promises. A stall that is long *relative to this machine's cadence*
      // is treated as a break instead, so a dropped hand never counts as time.
      const gap = lastTsRef.current === 0 ? 0 : now - lastTsRef.current;
      lastTsRef.current = now;

      if (gap > 0) {
        cadenceRef.current = cadenceRef.current === 0 ? gap : cadenceRef.current * 0.8 + gap * 0.2;
      }
      if (gap > Math.max(350, cadenceRef.current * 3)) holdRef.current = null;

      const dwell = dwellRef.current;

      // Motion gestures are events, not states.
      const motion = frame.motion;
      if (motion && motion.confidence >= 0.66 && now - lastMotionRef.current > CONFIG.motionCooldownMs) {
        lastMotionRef.current = now;
        commitRef.current(motion);
        holdRef.current = null;
        lockedRef.current = null;
        progressRef.current = 0;
        setReading(null);
        setLocked(false);
        return;
      }

      const best = frame.best;
      const runnerUp = frame.alternatives[0];
      const margin = best && runnerUp ? best.confidence - runnerUp.confidence : 1;
      const required =
        CONFIG.commitConfidence + Math.max(0, CONFIG.ambiguityMargin - margin) * 2;
      const viable = Boolean(best && best.confidence >= required);

      if (!best || !viable) {
        holdRef.current = null;
        progressRef.current = Math.max(0, progressRef.current - (Math.min(gap, 250) / dwell) * 2.4);

        // Only unlock after the hand has genuinely left the handshape, so a
        // single dropped frame doesn't invite a duplicate letter.
        if (now - lastViableRef.current > CONFIG.releaseGraceMs) {
          lockedRef.current = null;
          if (locked) setLocked(false);
        }
        if (progressRef.current === 0) setLabel(null);
        return;
      }

      lastViableRef.current = now;
      setLabel({ id: best.id, label: best.label });

      if (lockedRef.current === best.id) {
        // Held after committing: keep the ring full, do nothing else.
        progressRef.current = 1;
        if (!locked) setLocked(true);
        return;
      }

      if (holdRef.current?.id !== best.id) {
        // A new reading begins: drop the previous lock and leave the ring empty
        // until this one has been held for the full dwell.
        holdRef.current = { id: best.id, since: now };
        lockedRef.current = null;
        if (locked) setLocked(false);
      }

      progressRef.current = Math.min(1, (now - holdRef.current.since) / dwell);

      if (now - holdRef.current.since >= dwell) {
        commitRef.current(best);
        lockedRef.current = best.id;
        holdRef.current = null;
        progressRef.current = 1;
        setLocked(true);
      }
    });
  }, [subscribe, enabled, locked]);

  return { progressRef, readingId: reading?.id ?? null, readingLabel: reading?.label ?? null, locked };
}
