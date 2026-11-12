import type { SignEntry } from '../data/signs';
import { HandDiagram } from './HandDiagram';
import { ArrowUpRightIcon } from './icons';

interface SignCardProps {
  sign: SignEntry;
  onPractice: (id: string) => void;
  practiced: boolean;
}

function badgeFor(sign: SignEntry): string | null {
  if (!sign.recognized) {
    return sign.id === 'j' || sign.id === 'z' ? 'Motion' : 'Orientation';
  }
  return null;
}

export function SignCard({ sign, onPractice, practiced }: SignCardProps) {
  const badge = badgeFor(sign);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl2 border border-stone bg-card transition-[border-color,transform] duration-300 ease-editorial hover:-translate-y-[2px] hover:border-ink/20">
      <div className="relative flex aspect-[5/4] items-center justify-center overflow-hidden bg-sand/45">
        <span className="absolute left-3 top-2.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
          {sign.category === 'letter' ? `Letter ${sign.label}` : 'Gesture'}
        </span>

        {badge ? (
          <span className="absolute right-3 top-2.5 flex items-center gap-1.5 rounded-full border border-stone bg-card/80 px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted">
            <span className="h-1 w-1 rounded-full bg-faint" />
            {badge}
          </span>
        ) : practiced ? (
          <span className="absolute right-3 top-2.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-clay">
            Practised
          </span>
        ) : null}

        <HandDiagram
          shape={sign.shape}
          className="h-[94%] w-[94%] transition-transform duration-500 ease-editorial group-hover:scale-[1.035]"
          label={`Handshape for ${sign.name}`}
        />

        {sign.category === 'letter' && (
          <span className="absolute bottom-1.5 right-3.5 font-display text-[30px] leading-none text-ink/15 transition-colors duration-300 group-hover:text-ink/25">
            {sign.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-3.5 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[14px] font-medium tracking-[-0.005em]">{sign.name}</h3>
        </div>
        <p className="mt-1 text-[12px] leading-[1.55] text-muted">{sign.blurb}</p>

        <button
          type="button"
          onClick={() => onPractice(sign.id)}
          className="mt-3 inline-flex items-center gap-1.5 self-start border-b border-transparent pb-0.5 text-[12px] font-medium text-ink/75 transition-colors duration-200 hover:border-clay hover:text-clay"
        >
          Practice this sign
          <ArrowUpRightIcon size={13} />
        </button>
      </div>
    </article>
  );
}
