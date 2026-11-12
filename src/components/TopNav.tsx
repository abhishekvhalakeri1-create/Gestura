import { HandGlyph } from './icons';

export type View = 'studio' | 'dictionary';

interface TopNavProps {
  view: View;
  onChange: (view: View) => void;
  status: 'idle' | 'live' | 'simulated' | 'loading';
}

const TABS: { id: View; label: string; index: string }[] = [
  { id: 'studio', label: 'Interpreter', index: '01' },
  { id: 'dictionary', label: 'Dictionary', index: '02' },
];

const STATUS_COPY: Record<TopNavProps['status'], { label: string; dot: string }> = {
  idle: { label: 'Camera off', dot: 'bg-faint' },
  live: { label: 'On-device · live', dot: 'bg-clay' },
  simulated: { label: 'Simulated feed', dot: 'bg-ink/45' },
  loading: { label: 'Model loading', dot: 'bg-amber-600' },
};

export function TopNav({ view, onChange, status }: TopNavProps) {
  const copy = STATUS_COPY[status];

  return (
    <header className="sticky top-0 z-40 border-b border-stone bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-[66px] max-w-[1480px] items-center gap-8 px-5 sm:px-8 lg:px-12">
        <a
          href="#top"
          className="flex items-center gap-2.5"
          onClick={(event) => {
            event.preventDefault();
            onChange('studio');
          }}
        >
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-ink text-paper">
            <HandGlyph size={18} strokeWidth={1.4} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[21px] tracking-[-0.01em]">Gestura</span>
            <span className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.22em] text-faint">
              Sign studio
            </span>
          </span>
        </a>

        <nav className="flex h-full items-stretch gap-7 sm:gap-9" aria-label="Primary">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              data-active={view === tab.id}
              aria-current={view === tab.id ? 'page' : undefined}
              className={`tab-underline flex items-center gap-2 transition-colors duration-200 ${
                view === tab.id ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              <span className="font-mono text-[9.5px] tracking-[0.12em] text-faint">{tab.index}</span>
              <span className="text-[13.5px] font-medium tracking-[-0.005em]">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <span className="hidden items-center gap-2 md:flex">
            <span className={`h-[5px] w-[5px] rounded-full ${copy.dot}`} />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
              {copy.label}
            </span>
          </span>
          <span className="hidden h-4 w-px bg-stone md:block" />
          <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint lg:block">
            No video stored
          </span>
        </div>
      </div>
    </header>
  );
}
