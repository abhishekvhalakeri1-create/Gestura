import type { CameraController } from '../hooks/useCamera';
import type { RecognitionController } from '../hooks/useHandRecognition';
import type { FeedSource } from '../hooks/useHandRecognition';
import type { TranscriptToken } from '../types';
import { CameraStage } from './CameraStage';
import { TranscriptTape } from './TranscriptTape';

interface StudioViewProps {
  camera: CameraController;
  engine: RecognitionController;
  bindVideo: (element: HTMLVideoElement | null) => () => void;
  source: FeedSource;
  mirrored: boolean;
  showSkeleton: boolean;
  onToggleMirror: () => void;
  onToggleSkeleton: () => void;
  progressRef: React.MutableRefObject<number>;
  readingLabel: string | null;
  locked: boolean;
  tokens: TranscriptToken[];
  dwellMs: number;
  onDwellChange: (value: number) => void;
  onSpeak: () => void;
  onSpace: () => void;
  onBackspace: () => void;
  onClear: () => void;
  speaking: boolean;
  speechSupported: boolean;
  onPause: () => void;
}

const NOTES = [
  {
    title: 'Where the work happens',
    body: 'Landmarks and geometry run in this tab. No frame, image or transcript is sent to a server.',
  },
  {
    title: 'Signing a letter twice',
    body: 'Once a letter commits it stays locked until you release the shape, so a steady hand cannot flood the tape.',
  },
  {
    title: 'Gestures need motion',
    body: 'Wave for Hello, nod a fist for Yes, circle a flat palm for Please. A fist resting on an open palm is Help.',
  },
];

export function StudioView({
  camera,
  engine,
  bindVideo,
  source,
  mirrored,
  showSkeleton,
  onToggleMirror,
  onToggleSkeleton,
  progressRef,
  readingLabel,
  locked,
  tokens,
  dwellMs,
  onDwellChange,
  onSpeak,
  onSpace,
  onBackspace,
  onClear,
  speaking,
  speechSupported,
  onPause,
}: StudioViewProps) {
  return (
    <section className="mx-auto w-full max-w-[1480px] px-5 pb-16 pt-8 sm:px-8 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-px w-7 bg-ink/25" />
            <span className="eyebrow">Live interpreter</span>
          </div>
          <h1 className="mt-3 font-display text-[34px] leading-none tracking-[-0.02em] sm:text-[40px]">
            Studio
          </h1>
        </div>
        <p className="max-w-[36ch] text-[12.5px] leading-relaxed text-muted">
          {source === 'demo'
            ? 'A simulated hand is walking through a short word so the tape can be explored without a camera.'
            : 'Find a calm background and an even light. The camera reads the shape of your hand, not its picture.'}
        </p>
      </div>

      <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-[1.45fr_1fr] xl:gap-6">
        <CameraStage
          camera={camera}
          engine={engine}
          bindVideo={bindVideo}
          source={source}
          mirrored={mirrored}
          onToggleMirror={onToggleMirror}
          showSkeleton={showSkeleton}
          onToggleSkeleton={onToggleSkeleton}
          progressRef={progressRef}
          readingLabel={readingLabel}
          locked={locked}
          onPause={onPause}
        />

        <TranscriptTape
          engine={engine}
          tokens={tokens}
          progressRef={progressRef}
          readingLabel={readingLabel}
          locked={locked}
          dwellMs={dwellMs}
          onDwellChange={onDwellChange}
          onSpeak={onSpeak}
          onSpace={onSpace}
          onBackspace={onBackspace}
          onClear={onClear}
          speaking={speaking}
          speechSupported={speechSupported}
        />
      </div>

      <div className="mt-10 grid gap-8 border-t border-stone pt-7 sm:grid-cols-3 sm:gap-10">
        {NOTES.map((note) => (
          <div key={note.title}>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/70">
              {note.title}
            </h2>
            <p className="mt-2 max-w-[36ch] text-[12.5px] leading-[1.65] text-muted">{note.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
