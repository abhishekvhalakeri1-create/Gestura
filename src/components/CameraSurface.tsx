import { useEffect, useRef } from 'react';
import type { RecognitionController } from '../hooks/useHandRecognition';
import {
  createSkeletonRenderer,
  type SkeletonRenderer,
} from '../lib/skeletonRenderer';
import { smoothstep } from '../lib/geometry';
import type { FeedSource } from '../hooks/useHandRecognition';

interface CameraSurfaceProps {
  stream: MediaStream | null;
  bindVideo: (element: HTMLVideoElement | null) => () => void;
  engine: RecognitionController;
  mirrored: boolean;
  showSkeleton: boolean;
  source: FeedSource;
  className?: string;
  children?: React.ReactNode;
}

const HIGHLIGHT_FLOOR = 0.85;

/**
 * One video element, one canvas, one animation loop.
 *
 * The loop reads `engine.frameRef` directly, so a 30fps detection stream never
 * touches React. Everything continuous — landmark easing, the vermilion
 * warm-up — happens here in canvas space.
 */
export function CameraSurface({
  stream,
  bindVideo,
  engine,
  mirrored,
  showSkeleton,
  source,
  className = '',
  children,
}: CameraSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<SkeletonRenderer | null>(null);
  const videoSizeRef = useRef({ width: 1280, height: 720 });

  const mirrorRef = useRef(mirrored);
  const skeletonRef = useRef(showSkeleton);
  mirrorRef.current = mirrored;
  skeletonRef.current = showSkeleton;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.play().catch(() => {
      /* autoplay can be refused until the user interacts; the frame arrives anyway */
    });

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || source !== 'camera') return undefined;
    return bindVideo(video);
  }, [bindVideo, source]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const renderer = createSkeletonRenderer(canvas, videoSizeRef.current);
    rendererRef.current = renderer;

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      renderer.resize(rect.width, rect.height, Math.min(2, window.devicePixelRatio || 1));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const delta = now - last;
      last = now;

      const video = videoRef.current;
      if (source === 'demo') {
        // Synthetic landmarks live in a square space; using a square virtual
        // frame keeps the skeleton from being stretched across a 16:9 video.
        videoSizeRef.current.width = 900;
        videoSizeRef.current.height = 900;
      } else if (video && video.videoWidth > 0) {
        videoSizeRef.current.width = video.videoWidth;
        videoSizeRef.current.height = video.videoHeight;
      }

      const frame = engine.frameRef.current;
      const hands = skeletonRef.current && frame ? frame.hands : [];
      renderer.setHands(hands);

      const confidence = frame?.best?.confidence ?? 0;
      const emphasis =
        confidence > HIGHLIGHT_FLOOR
          ? smoothstep((confidence - HIGHLIGHT_FLOOR) / 0.12)
          : 0;

      renderer.draw({ mirrored: mirrorRef.current, emphasis }, delta);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.clear();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the frame ref is stable by design
  }, [engine.frameRef, source]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-[#121110]">
        {source === 'camera' ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label="Live camera feed"
            className="h-full w-full object-cover"
            style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}
          />
        ) : (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_28%,#2a2622_0%,#171512_58%,#100f0e_100%)]" />
            <div
              className="absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                maskImage: 'radial-gradient(65% 65% at 50% 45%, black 10%, transparent 78%)',
                WebkitMaskImage: 'radial-gradient(65% 65% at 50% 45%, black 10%, transparent 78%)',
              }}
            />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(0,0,0,0.22)',
        }}
      />

      {children}
    </div>
  );
}
