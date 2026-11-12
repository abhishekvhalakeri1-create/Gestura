import { useEffect, useRef } from 'react';

interface DwellRingProps {
  progressRef: React.MutableRefObject<number>;
  label: string | null;
  locked: boolean;
  size?: number;
}

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The dwell meter. The progress value changes 30 times a second, so it is
 * painted straight onto the SVG from an animation frame instead of being pushed
 * through React.
 */
export function DwellRing({ progressRef, label, locked, size = 46 }: DwellRingProps) {
  const circleRef = useRef<SVGCircleElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let last = -1;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const progress = Math.max(0, Math.min(1, progressRef.current));
      if (Math.abs(progress - last) < 0.004) return;
      last = progress;
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress));
      }
      if (glowRef.current) {
        glowRef.current.style.opacity = String(progress * 0.9);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        ref={glowRef}
        className="absolute inset-0 rounded-full bg-clay/20 opacity-0 blur-[6px] transition-opacity duration-300"
      />
      <svg width={size} height={size} viewBox="0 0 46 46" className="relative -rotate-90">
        <circle cx="23" cy="23" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
        <circle
          ref={circleRef}
          cx="23"
          cy="23"
          r={RADIUS}
          fill="none"
          stroke={locked ? '#F3EDE3' : '#D94E34'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          className="transition-[stroke] duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {label ? (
          <span
            className={`font-mono text-[13px] font-medium leading-none ${
              locked ? 'text-paper' : 'text-white'
            }`}
          >
            {label}
          </span>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
        )}
      </div>
    </div>
  );
}
