import { useEffect, useMemo, useState } from 'react';
import type { SignEntry } from '../data/signs';
import type { CameraController } from '../hooks/useCamera';
import type { FeedSource, RecognitionController } from '../hooks/useHandRecognition';
import { useFrameSnapshot } from '../hooks/useFrameSnapshot';
import { extractFeatures } from '../lib/handFeatures';
import { similarityTo, templateFor } from '../lib/classifier';
import { coach } from '../lib/coaching';
import { CameraSurface } from './CameraSurface';
import { HandDiagram } from './HandDiagram';
import { Button } from './ui/Button';
import { ArrowRightIcon, CameraIcon, CheckIcon, CloseIcon } from './icons';

interface PracticePanelProps {
  sign: SignEntry;
  onClose: () => void;
  camera: CameraController;
  engine: RecognitionController;
  bindVideo: (element: HTMLVideoElement | null) => () => void;
  source: FeedSource;
  mirrored: boolean;
  showSkeleton: boolean;
  onEnableCamera: () => void;
}

function verdictFor(score: number, hasHand: boolean) {
  if (!hasHand) return { label: 'Waiting for a hand', tone: 'muted' as const };
  if (score >= 0.85) return { label: 'That’s the shape', tone: 'clay' as const };
  if (score >= 0.68) return { label: 'Almost there', tone: 'ink' as const };
  if (score >= 0.4) return { label: 'Getting closer', tone: 'ink' as const };
  return { label: 'Not yet', tone: 'muted' as const };
}

export function PracticePanel({
  sign,
  onClose,
  camera,
  engine,
  bindVideo,
  source,
  mirrored,
  showSkeleton,
  onEnableCamera,
}: PracticePanelProps) {
  const frame = useFrameSnapshot(engine.frameRef, 10);
  const [best, setBest] = useState(0);

  const features = useMemo(() => {
    const hand = frame?.hands[0];
    if (!hand || !frame) return null;
    return extractFeatures(hand.landmarks, frame.aspect);
  }, [frame]);

  const template = templateFor(sign.id);
  const score = features ? similarityTo(features, sign.id) : 0;
  const cues = features && template ? coach(features, template) : [];
  const hasHand = Boolean(features);
  const verdict = verdictFor(score, hasHand);
  const live = camera.status === 'live' || source === 'demo';

  useEffect(() => {
    if (score > best + 0.002) setBest(score);
  }, [score, best]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-3 backdrop-blur-[2px] sm:p-6 lg:p-10"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Practise the sign ${sign.name}`}
        className="mx-auto my-2 w-full max-w-5xl animate-rise overflow-hidden rounded-xl3 border border-stone bg-paper shadow-sheet sm:my-0"
      >
        <header className="flex items-center justify-between border-b border-stone px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="eyebrow">Practice</span>
            <span className="h-3 w-px bg-stone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Side-by-side comparison
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close practice"
            className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-stone bg-card text-muted transition hover:border-ink/25 hover:text-ink"
          >
            <CloseIcon size={16} />
          </button>
        </header>

        <div className="grid lg:grid-cols-2">
          <div className="border-b border-stone px-5 py-6 sm:px-7 lg:border-b-0 lg:border-r">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Target</span>
              <span className="eyebrow">{sign.category === 'letter' ? 'Letter' : 'Gesture'}</span>
            </div>

            <div className="mt-3 flex aspect-[5/4] items-center justify-center rounded-xl2 bg-sand/60">
              <HandDiagram
                shape={sign.shape}
                className="h-[88%] w-[88%]"
                label={`Handshape for ${sign.name}`}
              />
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <h2 className="font-display text-[38px] leading-none tracking-[-0.02em]">{sign.name}</h2>
              <span className="text-[12.5px] text-muted">{sign.blurb}</span>
            </div>

            <ol className="mt-5 space-y-3">
              {sign.tips.map((tip, index) => (
                <li key={tip} className="flex gap-3">
                  <span className="mt-0.5 font-mono text-[10px] tracking-[0.12em] text-clay">
                    0{index + 1}
                  </span>
                  <p className="max-w-[42ch] text-[13px] leading-[1.65] text-ink/80">{tip}</p>
                </li>
              ))}
            </ol>

            {sign.movement && (
              <p className="mt-4 border-l-2 border-clay/40 pl-3 text-[12px] leading-relaxed text-muted">
                {sign.movement}
              </p>
            )}
            {sign.caveat && (
              <p className="mt-3 rounded-lg bg-card px-3 py-2.5 text-[11.5px] leading-relaxed text-muted">
                {sign.caveat}
              </p>
            )}
          </div>

          <div className="flex flex-col px-5 py-6 sm:px-7">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Your hand</span>
              <span
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint"
                title="Best match you have reached since opening this sign"
              >
                Peak {Math.round(best * 100)}%
              </span>
            </div>

            <div className="relative mt-3 aspect-[5/4] overflow-hidden rounded-xl2 border border-ink/20 bg-[#121110]">
              {live ? (
                <CameraSurface
                  stream={camera.stream}
                  bindVideo={bindVideo}
                  engine={engine}
                  mirrored={mirrored}
                  showSkeleton={showSkeleton}
                  source={source}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
                    Camera is off
                  </p>
                  <p className="max-w-[30ch] text-[12px] leading-relaxed text-white/40">
                    Turn the camera on to compare your hand with the illustration in real time.
                  </p>
                  <Button variant="primary" size="sm" onClick={onEnableCamera}>
                    <CameraIcon size={15} />
                    Enable camera
                  </Button>
                </div>
              )}

              {live && score >= 0.85 && (
                <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-full border border-white/15 bg-clay/85 px-3 py-1.5 backdrop-blur">
                  <CheckIcon size={13} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white">
                    Match {Math.round(score * 100)}%
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-medium text-ink">{verdict.label}</span>
                <span className="font-mono text-[13px] tabular text-ink">
                  {hasHand ? `${Math.round(score * 100)}%` : '—'}
                </span>
              </div>
              <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-stone">
                <div
                  className={`h-full rounded-full transition-[width,background-color] duration-200 ease-editorial ${
                    score >= 0.85 ? 'bg-clay' : 'bg-ink/60'
                  }`}
                  style={{ width: `${Math.max(2, score * 100)}%` }}
                />
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                Shape similarity · hold the pose to steady the reading
              </p>
            </div>

            <div className="mt-5 min-h-[92px] rounded-xl2 border border-stone bg-card px-4 py-3.5">
              <span className="eyebrow">Coaching</span>
              {cues.length === 0 ? (
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                  {hasHand
                    ? 'Nothing specific to fix right now. Hold it steady and watch the number settle.'
                    : 'Show one hand to the camera and cues will appear here, one thing at a time.'}
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {cues.map((cue) => (
                    <li key={cue.id} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink/85">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-clay" />
                      {cue.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!live && (
              <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
                <ArrowRightIcon size={14} />
                Practising works with either hand — the recogniser mirrors its templates
                instead of asking you to use your right.
              </p>
            )}
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone px-5 py-3.5 sm:px-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
            Esc to close · Nothing here reaches the transcript
          </p>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Back to the dictionary
          </Button>
        </footer>
      </div>
    </div>
  );
}
