import type { CameraController } from '../hooks/useCamera';
import type { RecognitionController } from '../hooks/useHandRecognition';
import { useFrameSnapshot } from '../hooks/useFrameSnapshot';
import { CameraSurface } from './CameraSurface';
import { DwellRing } from './DwellRing';
import { LockIcon, MirrorIcon, SkeletonIcon, SwitchCameraIcon } from './icons';

interface CameraStageProps {
  camera: CameraController;
  engine: RecognitionController;
  bindVideo: (element: HTMLVideoElement | null) => () => void;
  source: 'camera' | 'demo';
  mirrored: boolean;
  onToggleMirror: () => void;
  showSkeleton: boolean;
  onToggleSkeleton: () => void;
  progressRef: React.MutableRefObject<number>;
  readingLabel: string | null;
  locked: boolean;
  onPause: () => void;
}

function ControlButton({
  active,
  label,
  onClick,
  disabled,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-[9px] border transition-all duration-200 ease-spring active:scale-95 disabled:opacity-30 ${
        active
          ? 'border-white/70 bg-white text-ink'
          : 'border-white/15 bg-white/[0.06] text-white/75 hover:border-white/30 hover:bg-white/12 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export function CameraStage({
  camera,
  engine,
  bindVideo,
  source,
  mirrored,
  onToggleMirror,
  showSkeleton,
  onToggleSkeleton,
  progressRef,
  readingLabel,
  locked,
  onPause,
}: CameraStageProps) {
  const frame = useFrameSnapshot(engine.frameRef, 6);
  const hands = frame?.hands.length ?? 0;
  const confidence = frame?.best?.confidence ?? 0;
  const fps = frame?.fps ?? 0;
  const latency = frame?.inferenceMs ?? 0;
  const warming = engine.status === 'loading';
  const failed = engine.status === 'error';

  return (
    <div className="flex flex-col">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-clay" />
          </span>
          <span className="eyebrow whitespace-nowrap">
            Studio 01
            <span className="hidden xs:inline"> · {source === 'demo' ? 'Simulated' : 'Live'}</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:gap-3.5">
          <span className="tabular">{fps.toFixed(0)} fps</span>
          <span className="h-2.5 w-px bg-stone" />
          <span className="tabular">
            {hands} hand{hands === 1 ? '' : 's'}
          </span>
          {source === 'camera' && (
            <>
              <span className="hidden h-2.5 w-px bg-stone sm:block" />
              <span className="hidden tabular sm:block">{latency.toFixed(0)} ms</span>
            </>
          )}
          <span className="hidden h-2.5 w-px bg-stone sm:block" />
          <button
            type="button"
            onClick={onPause}
            className="hidden rounded border border-stone px-1.5 py-0.5 uppercase tracking-[0.14em] text-muted transition hover:border-ink/25 hover:text-ink sm:block"
          >
            Pause
          </button>
        </div>
      </div>

      <div className="stage-shadow relative aspect-[4/3] w-full overflow-hidden rounded-xl3 border border-ink/15 bg-[#121110]">
        <CameraSurface
          stream={camera.stream}
          bindVideo={bindVideo}
          engine={engine}
          mirrored={mirrored}
          showSkeleton={showSkeleton}
          source={source}
        />

        {/* privacy */}
        <div className="pointer-events-none absolute left-3 top-3 flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-white/15 bg-black/35 px-2.5 py-1.5 backdrop-blur-md sm:left-3.5 sm:top-3.5 sm:px-3">
          <LockIcon size={11} />
          <span className="truncate font-mono text-[9.5px] uppercase tracking-[0.12em] text-white/75">
            <span className="sm:hidden">On-device · No video stored</span>
            <span className="hidden sm:inline">On-device processing · No video stored</span>
          </span>
        </div>

        {/* reading chip */}
        <div className="pointer-events-none absolute right-3 top-3 hidden sm:right-3.5 sm:top-3.5 sm:block">
          {source === 'demo' ? (
            <span className="rounded-full border border-clay/50 bg-clay/15 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#F7C9BE] backdrop-blur-md">
              Simulated feed
            </span>
          ) : confidence > 0 ? (
            <span className="flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 backdrop-blur-md">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-white/55">
                read
              </span>
              <span className="font-mono text-[11px] tabular text-white/90">
                {(confidence * 100).toFixed(0)}%
              </span>
            </span>
          ) : null}
        </div>

        {/* empty guidance */}
        {hands === 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-[46%] -translate-y-1/2 px-4 text-center">
            <div className="mx-auto max-w-[380px] rounded-2xl bg-black/30 px-5 py-4 backdrop-blur-[2px]">
            {failed ? (
              <>
                <p className="font-display text-[22px] text-white/85">The model didn’t start</p>
                <p className="mx-auto mt-2 max-w-[36ch] text-[12px] leading-relaxed text-white/45">
                  {engine.message}
                </p>
                <button
                  type="button"
                  onClick={engine.retry}
                  className="pointer-events-auto mt-4 rounded-full border border-white/25 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80 transition hover:bg-white/10"
                >
                  Retry
                </button>
              </>
            ) : warming ? (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
                  Warming up
                </p>
                <p className="mx-auto mt-2 max-w-[34ch] text-[12px] leading-relaxed text-white/40">
                  Loading 21 landmarks and a local gesture model. This happens once per session.
                </p>
              </>
            ) : source === 'demo' ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                A synthetic hand, walking through a word
              </p>
            ) : (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                  No hand in frame
                </p>
                <p className="mx-auto mt-2 max-w-[38ch] text-[12px] leading-relaxed text-white/35">
                  Hold one hand at chest height, about an arm’s length away. Palm or knuckles
                  towards the camera reads most reliably.
                </p>
              </>
            )}
            </div>
          </div>
        )}

        {/* control bar */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 backdrop-blur-xl">
          <DwellRing progressRef={progressRef} label={readingLabel?.slice(0, 1) ?? null} locked={locked} />

          <div className="min-w-0 flex-1">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">
              {locked ? 'Committed' : readingLabel ? 'Holding' : 'Listening'}
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5 sm:gap-2">
              <span className="truncate font-mono text-[13px] font-medium text-white">
                {readingLabel ?? '—'}
              </span>
              <span className="hidden font-mono text-[10px] tabular text-white/40 sm:inline">
                {confidence > 0 ? `${(confidence * 100).toFixed(0)}%` : 'no reading'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ControlButton active={mirrored} label="Mirror the preview" onClick={onToggleMirror}>
              <MirrorIcon size={17} />
            </ControlButton>
            <ControlButton active={showSkeleton} label="Toggle the landmark overlay" onClick={onToggleSkeleton}>
              <SkeletonIcon size={17} />
            </ControlButton>
            <ControlButton
              label="Switch camera"
              onClick={() => void camera.switchCamera()}
              disabled={camera.devices.length < 2}
            >
              <SwitchCameraIcon size={17} />
            </ControlButton>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 rounded-xl3 ring-1 ring-inset ring-white/5" />
      </div>
    </div>
  );
}
