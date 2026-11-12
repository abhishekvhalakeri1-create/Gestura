import { HandDiagram } from './HandDiagram';
import { Button } from './ui/Button';
import { ArrowRightIcon, CameraIcon, InfoIcon, LockIcon, PlayIcon } from './icons';
import { SIGNS } from '../data/signs';
import type { CameraError, CameraStatus } from '../types';

interface LandingViewProps {
  cameraStatus: CameraStatus;
  error: CameraError | null;
  modelStatus: 'idle' | 'loading' | 'ready' | 'error';
  onEnable: () => void;
  onDemo: () => void;
  onDismissError: () => void;
}

const FIGURE = SIGNS.find((sign) => sign.id === 'b')!;
const STEPS = [
  {
    index: '01',
    title: 'Let the camera in',
    body: 'Your browser asks once. The video is read frame by frame on this device and never uploaded, recorded or sent anywhere.',
  },
  {
    index: '02',
    title: 'Make a letter',
    body: 'Twenty-one handshapes are read from a still hand, plus six everyday gestures. The dictionary shows exactly where each finger goes.',
  },
  {
    index: '03',
    title: 'Hold, then release',
    body: 'A letter settles after 1.2 seconds of stillness. Release your hand to sign it twice. Then let the page speak for you.',
  },
];

export function LandingView({
  cameraStatus,
  error,
  modelStatus,
  onEnable,
  onDemo,
  onDismissError,
}: LandingViewProps) {
  const requesting = cameraStatus === 'requesting';

  return (
    <section className="mx-auto w-full max-w-[1480px] px-5 pb-20 pt-10 sm:px-8 lg:px-12 lg:pt-16">
      <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] xl:gap-20">
        <div className="animate-rise">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-ink/25" />
            <span className="eyebrow">Hand sign recognition · On device</span>
          </div>

          <h1 className="mt-7 max-w-[13ch] font-display text-[46px] leading-[0.94] tracking-[-0.02em] text-ink sm:max-w-[15ch] sm:text-[62px] lg:text-[70px]">
            A quiet room for your hands to{' '}
            <span className="italic">speak.</span>
          </h1>

          <p className="mt-7 max-w-[46ch] text-[15.5px] leading-[1.65] text-muted">
            Gestura reads American Sign Language fingerspelling and the everyday
            gestures that hold a conversation together — as you make them, in this
            tab, at the speed of a hand.
          </p>

          {error ? (
            <div className="mt-8 max-w-[52ch] rounded-xl2 border border-clay/25 bg-[#FBF1EE] p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-clay">
                  <InfoIcon size={16} />
                </span>
                <div>
                  <h2 className="text-[14px] font-medium text-ink">{error.title}</h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{error.message}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button variant="primary" size="sm" onClick={onEnable}>
                      <CameraIcon size={15} />
                      Try again
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onDemo}>
                      <PlayIcon size={14} />
                      Use the simulated feed
                    </Button>
                    <button
                      type="button"
                      onClick={onDismissError}
                      className="ml-1 text-[12.5px] text-muted underline decoration-stone underline-offset-4 transition hover:text-ink"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button variant="primary" size="lg" onClick={onEnable} disabled={requesting}>
                  <CameraIcon size={17} />
                  {requesting ? 'Waiting for permission…' : 'Enable Camera to Begin'}
                </Button>
                <Button variant="ghost" size="lg" onClick={onDemo} className="px-3">
                  Try the simulated feed
                  <ArrowRightIcon size={15} />
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <LockIcon size={12} />
                  On-device processing · No video stored
                </span>
                <span className="h-3 w-px bg-stone" />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
                  {modelStatus === 'loading'
                    ? 'Warming up the model'
                    : 'Works offline after first load'}
                </span>
              </div>
            </>
          )}
        </div>

        <figure className="relative mx-auto w-full max-w-[440px] animate-rise lg:mx-0">
          <div className="relative overflow-hidden rounded-xl3 border border-stone bg-card p-6 pt-5 shadow-[0_40px_80px_-64px_rgba(24,24,27,0.5)]">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Fig. 01</span>
              <span className="eyebrow">Letter B</span>
            </div>

            <div className="relative mt-4 flex aspect-[5/5] items-center justify-center rounded-xl2 bg-sand/55">
              <span className="absolute left-3 top-2.5 h-3 w-3 border-l border-t border-ink/15" />
              <span className="absolute right-3 top-2.5 h-3 w-3 border-r border-t border-ink/15" />
              <span className="absolute bottom-2.5 left-3 h-3 w-3 border-b border-l border-ink/15" />
              <span className="absolute bottom-2.5 right-3 h-3 w-3 border-b border-r border-ink/15" />
              <HandDiagram
                shape={FIGURE.shape}
                className="h-[86%] w-[86%]"
                label="Illustration of the ASL letter B"
              />
              <span className="absolute bottom-3 right-4 font-display text-[38px] leading-none text-ink/25">
                B
              </span>
            </div>

            <figcaption className="mt-4 flex items-center justify-between border-t border-stone pt-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                21 landmarks · 30 fps
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                0 uploads
              </span>
            </figcaption>
          </div>
        </figure>
      </div>

      <div className="mt-20 border-t border-stone pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-[26px] tracking-[-0.01em]">How it works</h2>
          <span className="eyebrow">Three quiet steps</span>
        </div>

        <ol className="mt-8 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step) => (
            <li key={step.index} className="relative border-t border-ink/10 pt-5">
              <span className="absolute -top-px left-0 h-px w-9 bg-clay" />
              <span className="font-mono text-[10.5px] tracking-[0.18em] text-clay">
                {step.index}
              </span>
              <h3 className="mt-3 font-display text-[21px] leading-tight tracking-[-0.01em]">
                {step.title}
              </h3>
              <p className="mt-2.5 max-w-[34ch] text-[13px] leading-[1.7] text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-stone pt-6">
        <span className="eyebrow">Reads</span>
        {[
          '21 static letters',
          '6 conversational signs',
          'J and Z are motion signs',
          'H, P and Q share a handshape',
        ].map((item) => (
          <span key={item} className="text-[12px] text-muted">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
