import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HandLandmarker } from '@mediapipe/tasks-vision';
import type { Candidate, DetectedHand, DetectedSign, RecognitionFrame } from '../types';
import { CONFIG } from '../lib/config';
import { classifyShape } from '../lib/classifier';
import { extractFeatures } from '../lib/handFeatures';
import { DemoFeed } from '../lib/demoFeed';
import { MotionTracker } from '../lib/motion';

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error';
export type FeedSource = 'camera' | 'demo';

interface Options {
  /** Run the detection loop. */
  active: boolean;
  source: FeedSource;
  /** The currently visible <video>, if the camera feed is in use. */
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
}

export interface RecognitionController {
  status: EngineStatus;
  message: string;
  frameRef: React.MutableRefObject<RecognitionFrame | null>;
  subscribe: (listener: (frame: RecognitionFrame) => void) => () => void;
  retry: () => void;
}

const MIN_READING_CONFIDENCE = 0.45;

export function useHandRecognition({ active, source, videoRef }: Options): RecognitionController {
  const [status, setStatus] = useState<EngineStatus>('idle');
  const [message, setMessage] = useState('Model idle');
  const [attempt, setAttempt] = useState(0);

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const loadingRef = useRef<Promise<void> | null>(null);
  const frameRef = useRef<RecognitionFrame | null>(null);
  const listenersRef = useRef(new Set<(frame: RecognitionFrame) => void>());
  const trackerRef = useRef(new MotionTracker());
  const demoRef = useRef(new DemoFeed());
  const fpsRef = useRef(0);
  const lastDetectRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const sourceRef = useRef<FeedSource>(source);
  sourceRef.current = source;

  const subscribe = useCallback((listener: (frame: RecognitionFrame) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const publish = useCallback(
    (hands: DetectedHand[], ts: number, inferenceMs: number, aspect: number) => {
      const readings = hands.map((hand) => {
        const features = extractFeatures(hand.landmarks, aspect);
        return features ? classifyShape(features) : [];
      });

      let best: DetectedSign | null = null;
      let alternatives: Candidate[] = [];

      readings.forEach((list) => {
        const top = list[0];
        if (!top) return;
        if (!best || top.confidence > best.confidence) {
          best = {
            id: top.entry.id,
            label: top.entry.label,
            confidence: top.confidence,
            via: 'shape',
          };
          alternatives = list.slice(1, 4).map((reading) => ({
            id: reading.entry.id,
            label: reading.entry.label,
            confidence: reading.confidence,
          }));
        }
      });

      if (best && (best as DetectedSign).confidence < MIN_READING_CONFIDENCE) {
        best = null;
        alternatives = [];
      }

      // The simulated feed is a shape drill; motion gestures only make sense
      // when a real hand is moving in front of the camera.
      const motion =
        sourceRef.current === 'demo' ? null : trackerRef.current.update(hands, aspect, ts);

      const frame: RecognitionFrame = {
        ts,
        hands,
        best,
        alternatives,
        motion,
        fps: fpsRef.current,
        inferenceMs,
        aspect,
      };

      frameRef.current = frame;
      listenersRef.current.forEach((listener) => listener(frame));
    },
    [],
  );

  const load = useCallback(async () => {
    if (landmarkerRef.current) return;
    if (loadingRef.current) return loadingRef.current;

    const task = (async () => {
      setStatus('loading');
      setMessage('Warming up the on-device model');

      const vision = await import('@mediapipe/tasks-vision');

      let fileset: Awaited<ReturnType<typeof vision.FilesetResolver.forVisionTasks>> | null = null;
      let failure: unknown = null;

      for (const wasmPath of CONFIG.wasmPaths) {
        try {
          fileset = await vision.FilesetResolver.forVisionTasks(wasmPath);
          break;
        } catch (error) {
          failure = error;
        }
      }

      if (!fileset) throw failure ?? new Error('Could not load the vision runtime');

      for (const modelPath of CONFIG.modelPaths) {
        for (const delegate of ['GPU', 'CPU'] as const) {
          try {
            landmarkerRef.current = await vision.HandLandmarker.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: modelPath, delegate },
              runningMode: 'VIDEO',
              numHands: CONFIG.maxHands,
              minHandDetectionConfidence: 0.55,
              minHandPresenceConfidence: 0.5,
              minTrackingConfidence: 0.5,
            });
            setStatus('ready');
            setMessage('Model ready');
            return;
          } catch (error) {
            failure = error;
          }
        }
      }

      throw failure ?? new Error('Could not load the hand landmark model');
    })();

    loadingRef.current = task;

    try {
      await task;
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? `The vision model could not start. ${error.message}`
          : 'The vision model could not start.',
      );
    } finally {
      loadingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let raf = 0;

    const emitDemoFrame = (now: number) => {
      const hands = demoRef.current.next(now);
      publish(hands, now, 0, 1);
    };

    const run = () => {
      raf = requestAnimationFrame(run);
      if (cancelled) return;

      const now = performance.now();

      if (source === 'demo') {
        if (now - lastDetectRef.current < CONFIG.detectIntervalMs) return;
        fpsRef.current = fpsRef.current * 0.9 + (1000 / Math.max(1, now - lastDetectRef.current)) * 0.1;
        lastDetectRef.current = now;
        emitDemoFrame(now);
        return;
      }

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) return;
      if (video.currentTime === lastVideoTimeRef.current) return;
      if (now - lastDetectRef.current < CONFIG.detectIntervalMs) return;

      const delta = now - lastDetectRef.current;
      if (delta > 0 && delta < 1500) {
        const instant = 1000 / delta;
        fpsRef.current = fpsRef.current === 0 ? instant : fpsRef.current * 0.9 + instant * 0.1;
      }
      lastDetectRef.current = now;
      lastVideoTimeRef.current = video.currentTime;

      const started = performance.now();
      try {
        const result = landmarker.detectForVideo(video, now);
        const inferenceMs = performance.now() - started;

        const hands: DetectedHand[] = (result.landmarks ?? []).map((landmarks, index) => {
          const category = result.handednesses?.[index]?.[0];
          const name = category?.categoryName;
          return {
            landmarks: landmarks.map((point) => ({ x: point.x, y: point.y, z: point.z })),
            handedness: name === 'Left' || name === 'Right' ? name : 'Unknown',
            score: category?.score ?? 0,
          };
        });

        publish(hands, now, inferenceMs, video.videoWidth / (video.videoHeight || 1));
      } catch {
        // A dropped frame is not fatal; the next one usually succeeds.
      }
    };

    if (source === 'demo') {
      raf = requestAnimationFrame(run);
    } else {
      void load().then(() => {
        if (!cancelled) raf = requestAnimationFrame(run);
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lastVideoTimeRef.current = -1;
      if (source === 'demo') demoRef.current.reset(0);
    };
  }, [active, source, videoRef, publish, load, attempt]);

  useEffect(() => {
    if (!active) {
      frameRef.current = null;
      trackerRef.current.reset();
      fpsRef.current = 0;
    }
  }, [active]);

  useEffect(
    () => () => {
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    },
    [],
  );

  const retry = useCallback(() => {
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    loadingRef.current = null;
    setStatus('idle');
    setAttempt((value) => value + 1);
  }, []);

  // Dev-only handle so the recognition stream can be inspected from the console.
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    (window as unknown as { __gesturaFrame?: () => RecognitionFrame | null }).__gesturaFrame = () =>
      frameRef.current;
  }

  // A stable identity matters: consumers attach a canvas render loop to this
  // object, and a fresh object on every render would tear that loop down and
  // clear the overlay mid-frame.
  return useMemo(
    () => ({ status, message, frameRef, subscribe, retry }),
    [status, message, subscribe, retry],
  );
}
