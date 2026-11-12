/** Shared domain types for the Gestura recognition pipeline. */

export interface Vec2 {
  x: number;
  y: number;
}

/** MediaPipe hand landmark: normalised image coordinates, z is relative depth. */
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type Handedness = 'Left' | 'Right' | 'Unknown';

export interface DetectedHand {
  landmarks: Landmark[];
  handedness: Handedness;
  score: number;
}

export interface Candidate {
  id: string;
  label: string;
  confidence: number;
}

export type SignCategory = 'letter' | 'gesture';

export type MotionKind = 'wave' | 'nod' | 'shake' | 'circle' | 'tap' | 'descend' | 'none';

export interface DetectedSign {
  id: string;
  label: string;
  confidence: number;
  via: 'shape' | 'motion';
}

export interface RecognitionFrame {
  /** performance.now() timestamp of the detection. */
  ts: number;
  hands: DetectedHand[];
  /** Best matching static sign across every visible hand. */
  best: DetectedSign | null;
  /** Runner-up readings, useful for honest "is it H or U?" UI. */
  alternatives: Candidate[];
  /** A gesture recognised from movement over time, which outranks shape. */
  motion: DetectedSign | null;
  fps: number;
  inferenceMs: number;
  /** videoWidth / videoHeight, used to un-squash landmark geometry. */
  aspect: number;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export type CameraStatus = 'idle' | 'requesting' | 'live' | 'error';

export type CameraErrorKind =
  | 'denied'
  | 'missing'
  | 'busy'
  | 'insecure'
  | 'unsupported'
  | 'unknown';

export interface CameraError {
  kind: CameraErrorKind;
  title: string;
  message: string;
}

export interface TranscriptToken {
  id: string;
  kind: 'letter' | 'word' | 'space';
  value: string;
  at: number;
  confidence?: number;
}
