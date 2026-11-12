import { useMemo } from 'react';
import type { TranscriptToken } from '../types';
import type { RecognitionController } from '../hooks/useHandRecognition';
import { useFrameSnapshot } from '../hooks/useFrameSnapshot';
import { transcriptText } from '../lib/transcript';
import { DWELL_OPTIONS } from '../lib/config';
import { Button } from './ui/Button';
import { DwellRing } from './DwellRing';
import { BackspaceIcon, SpeakerIcon, SpaceIcon, TrashIcon } from './icons';

interface TranscriptTapeProps {
  engine: RecognitionController;
  tokens: TranscriptToken[];
  progressRef: React.MutableRefObject<number>;
  readingLabel: string | null;
  locked: boolean;
  dwellMs: number;
  onDwellChange: (value: number) => void;
  onSpeak: () => void;
  onSpace: () => void;
  onBackspace: () => void;
  onClear: () => void;
  speaking: boolean;
  speechSupported: boolean;
}

export function TranscriptTape({
  engine,
  tokens,
  progressRef,
  readingLabel,
  locked,
  dwellMs,
  onDwellChange,
  onSpeak,
  onSpace,
  onBackspace,
  onClear,
  speaking,
  speechSupported,
}: TranscriptTapeProps) {
  const frame = useFrameSnapshot(engine.frameRef, 8);
  const confidence = frame?.best?.confidence ?? 0;
  const text = useMemo(() => transcriptText(tokens), [tokens]);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const empty = tokens.length === 0;

  return (
    <aside className="card flex h-full min-h-[420px] flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-stone px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="eyebrow">Paper tape</span>
          <span className="h-3 w-px bg-stone" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            Transcription
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] tabular uppercase tracking-[0.12em] text-muted">
          <span>
            {text.length} {text.length === 1 ? 'char' : 'chars'}
          </span>
          <span className="h-2.5 w-px bg-stone" />
          <span>
            {words} {words === 1 ? 'word' : 'words'}
          </span>
        </div>
      </header>

      <div className="ruled-paper relative flex-1 overflow-y-auto px-5 py-5">
        {empty ? (
          <div className="flex h-full min-h-[200px] flex-col items-start justify-center gap-2">
            <p className="font-display text-[24px] leading-tight text-ink/70">
              The tape is blank.
            </p>
            <p className="max-w-[32ch] text-[12.5px] leading-relaxed text-muted">
              Hold a letter in front of the camera for {dwellMs / 1000} seconds and it
              will settle here, one character at a time.
            </p>
          </div>
        ) : (
          <p className="font-mono text-[26px] leading-[48px] tracking-[-0.02em] text-ink">
            {tokens.map((token, index) => {
              const isLast = index === tokens.length - 1;
              if (token.kind === 'space') {
                return (
                  <span key={token.id} className="inline-block w-[0.6em]">
                    {'\u00A0'}
                  </span>
                );
              }
              return (
                <span
                  key={token.id}
                  className={isLast ? 'animate-settle inline-block' : 'inline-block'}
                  title={
                    token.confidence
                      ? `${Math.round(token.confidence * 100)}% confidence`
                      : undefined
                  }
                >
                  {token.kind === 'word' ? token.value : token.value}
                </span>
              );
            })}
            <span className="ml-[2px] inline-block h-[22px] w-[2px] translate-y-[3px] animate-caret bg-clay align-baseline" />
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-stone px-4 py-3">
        <DwellRing progressRef={progressRef} label={readingLabel?.slice(0, 1) ?? null} locked={locked} />
        <div className="min-w-0 flex-1">
          <div className="eyebrow">
            {locked ? 'Committed · release to repeat' : readingLabel ? 'Dwelling' : 'Waiting'}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="truncate text-[13px] font-medium text-ink">
              {readingLabel ?? 'No handshape yet'}
            </span>
            <span className="font-mono text-[10.5px] tabular text-muted">
              {confidence > 0 ? `${(confidence * 100).toFixed(0)}%` : '—'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="eyebrow hidden sm:block">Dwell</span>
          <div className="flex rounded-lg border border-stone bg-paper p-0.5">
            {DWELL_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onDwellChange(option)}
                aria-pressed={dwellMs === option}
                className={`rounded-[6px] px-2 py-1 font-mono text-[10.5px] tabular transition-colors duration-200 ${
                  dwellMs === option
                    ? 'bg-ink text-paper'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {(option / 1000).toFixed(1)}s
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-stone px-4 py-3">
        <Button
          variant="primary"
          size="sm"
          onClick={onSpeak}
          disabled={!speechSupported || empty}
          title={speechSupported ? 'Read the transcript aloud' : 'Speech synthesis is unavailable'}
        >
          <SpeakerIcon size={15} />
          {speaking ? 'Speaking…' : 'Speak aloud'}
        </Button>
        <Button variant="secondary" size="sm" onClick={onSpace} disabled={empty} title="Add a space (spacebar)">
          <SpaceIcon size={15} />
          Space
        </Button>
        <Button variant="secondary" size="sm" onClick={onBackspace} disabled={empty} title="Remove the last mark (backspace)">
          <BackspaceIcon size={15} />
          Backspace
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={empty}
          className="ml-auto"
          title="Clear the tape"
        >
          <TrashIcon size={15} />
          Clear
        </Button>
      </div>
    </aside>
  );
}
