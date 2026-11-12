/** Tunables that shape how forgiving the interpreter feels. */

const env = import.meta.env;

export const CONFIG = {
  /** How long a handshape must be held before it lands in the transcript. */
  dwellMs: 1200,
  /** Minimum handshape confidence before we consider committing anything. */
  commitConfidence: 0.72,
  /** Near-ties (M/N, U/V) must be more confident before they auto-commit. */
  ambiguityMargin: 0.06,
  /** Confidence at which the skeleton overlay turns vermilion. */
  highlightConfidence: 0.85,
  /** Detection cadence. The drawing loop still runs at display refresh. */
  detectIntervalMs: 1000 / 30,
  /** Cooldown between two motion-gesture commits. */
  motionCooldownMs: 1800,
  /** A committed letter will not repeat until the hand has been released. */
  releaseGraceMs: 220,
  /** Wasm runtime: served locally after `npm run assets`, CDN as a fallback. */
  wasmPaths: [
    (env.VITE_MEDIAPIPE_WASM as string) || '/mediapipe/wasm',
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm',
  ],
  /** Hand landmark model: bundled in /public/models, CDN as a fallback. */
  modelPaths: [
    (env.VITE_HAND_MODEL_URL as string) || '/models/hand_landmarker.task',
    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  ],
  maxHands: 2,
} as const;

export const DWELL_OPTIONS = [800, 1200, 1800] as const;
