import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'ink';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-clay text-white border border-clay shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_14px_28px_-18px_rgba(217,78,52,0.9)] hover:bg-[#c9462e] hover:border-[#c9462e]',
  secondary:
    'bg-card text-ink border border-stone hover:border-ink/25 hover:bg-card',
  ghost: 'bg-transparent text-muted border border-transparent hover:text-ink hover:bg-sand/70',
  quiet: 'bg-sand/80 text-ink border border-transparent hover:bg-[#e8e2d8]',
  ink: 'bg-ink text-paper border border-ink hover:bg-[#2a2a2e]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-[13.5px] gap-2 rounded-[10px]',
  lg: 'h-12 px-6 text-[14.5px] gap-2.5 rounded-xl',
  icon: 'h-9 w-9 rounded-[9px]',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex select-none items-center justify-center font-medium tracking-[-0.005em]',
        'transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-spring',
        'active:scale-[0.975] disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-stone bg-paper px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-muted">
      {children}
    </kbd>
  );
}
