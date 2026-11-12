import { useEffect, useState } from 'react';
import type { RecognitionFrame } from '../types';

/**
 * A throttled view onto the 30fps detection stream for components that need to
 * re-render with numbers (fps, confidence). The canvas overlay never uses this —
 * it reads `frameRef` inside its own animation frame.
 */
export function useFrameSnapshot(
  frameRef: React.MutableRefObject<RecognitionFrame | null>,
  hz = 8,
): RecognitionFrame | null {
  const [snapshot, setSnapshot] = useState<RecognitionFrame | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSnapshot((current) => {
        const next = frameRef.current;
        if (next === current) return current;
        if (!next && !current) return current;
        return next;
      });
    }, 1000 / hz);

    return () => window.clearInterval(interval);
  }, [frameRef, hz]);

  return snapshot;
}
