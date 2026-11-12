import { useMemo, useState } from 'react';
import { GESTURE_SIGNS, LETTER_SIGNS, SIGNS, type SignEntry } from '../data/signs';
import { SignCard } from './SignCard';
import { SearchIcon } from './icons';

type Filter = 'all' | 'letter' | 'gesture';

interface DictionaryViewProps {
  onPractice: (id: string) => void;
  practicedIds: Set<string>;
}

const FILTERS: { id: Filter; label: string; count: number }[] = [
  { id: 'all', label: 'Everything', count: SIGNS.length },
  { id: 'letter', label: 'Letters', count: LETTER_SIGNS.length },
  { id: 'gesture', label: 'Gestures', count: GESTURE_SIGNS.length },
];

export function DictionaryView({ onPractice, practicedIds }: DictionaryViewProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const signs = useMemo(() => {
    const pool: SignEntry[] =
      filter === 'all' ? SIGNS : filter === 'letter' ? LETTER_SIGNS : GESTURE_SIGNS;
    const needle = query.trim().toLowerCase();
    if (!needle) return pool;
    return pool.filter((sign) =>
      `${sign.label} ${sign.name} ${sign.blurb} ${sign.keywords}`.toLowerCase().includes(needle),
    );
  }, [filter, query]);

  return (
    <section className="mx-auto w-full max-w-[1480px] px-5 pb-20 pt-10 sm:px-8 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-px w-7 bg-ink/25" />
            <span className="eyebrow">Sign dictionary</span>
          </div>
          <h1 className="mt-4 max-w-[22ch] font-display text-[40px] leading-[1.02] tracking-[-0.02em] sm:text-[48px]">
            Thirty-two shapes to start with.
          </h1>
          <p className="mt-4 max-w-[52ch] text-[14px] leading-[1.65] text-muted">
            Every card is drawn from the same rig the recogniser uses, so the diagram
            and the template can never drift apart. Pick one and try it against your
            own hand.
          </p>
        </div>
        <p className="max-w-[30ch] text-[12px] leading-relaxed text-muted">
          Each card carries two plain-language cues. Practise without the pressure of
          committing anything to the tape.
        </p>
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-stone bg-card p-0.5">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className={`flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors duration-200 ${
                filter === option.id ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
              }`}
            >
              {option.label}
              <span
                className={`font-mono text-[9.5px] tabular ${
                  filter === option.id ? 'text-paper/55' : 'text-faint'
                }`}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>

        <label className="relative flex h-[38px] min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-stone bg-card px-3 focus-within:border-ink/30 sm:max-w-[280px]">
          <span className="text-faint">
            <SearchIcon size={15} />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search signs or cues"
            aria-label="Search signs"
            className="h-full w-full bg-transparent text-[12.5px] text-ink outline-none"
          />
        </label>

        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {signs.length} of {SIGNS.length} shown
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {signs.map((sign) => (
          <SignCard
            key={sign.id}
            sign={sign}
            onPractice={onPractice}
            practiced={practicedIds.has(sign.id)}
          />
        ))}
      </div>

      {signs.length === 0 && (
        <div className="mt-10 rounded-xl2 border border-dashed border-stone bg-card/60 px-6 py-14 text-center">
          <p className="font-display text-[22px] text-ink/70">No sign by that name.</p>
          <p className="mx-auto mt-2 max-w-[36ch] text-[12.5px] leading-relaxed text-muted">
            Try a letter, a word like “help”, or clear the search to see the full set.
          </p>
        </div>
      )}

      <div className="mt-12 grid gap-6 rounded-xl2 border border-stone bg-card p-6 sm:grid-cols-[1.4fr_1fr] sm:p-7">
        <div>
          <h2 className="font-display text-[22px] tracking-[-0.01em]">What gets auto-committed</h2>
          <p className="mt-2.5 max-w-[52ch] text-[12.5px] leading-[1.7] text-muted">
            Gestura reads a still hand into 21 letters. J and Z live in motion, so they are
            shown here to learn but will not land on the tape. H, P and Q differ from U, K
            and G only by the direction your hand points, and this build reads handshape
            rather than orientation.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-4 self-center border-t border-stone pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <div>
            <dt className="eyebrow">Auto-read</dt>
            <dd className="mt-1 font-mono text-[18px] tabular">21</dd>
          </div>
          <div>
            <dt className="eyebrow">Motion only</dt>
            <dd className="mt-1 font-mono text-[18px] tabular">2</dd>
          </div>
          <div>
            <dt className="eyebrow">Orientation</dt>
            <dd className="mt-1 font-mono text-[18px] tabular">3</dd>
          </div>
          <div>
            <dt className="eyebrow">Gestures practising</dt>
            <dd className="mt-1 font-mono text-[18px] tabular">6</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
