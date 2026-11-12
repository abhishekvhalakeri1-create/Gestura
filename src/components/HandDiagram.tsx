import { useMemo } from 'react';
import { buildHandDrawing } from '../lib/handSvg';
import type { HandShape } from '../lib/handPose';

export type DiagramTone = 'sand' | 'ink' | 'ghost' | 'clay';

const TONES: Record<DiagramTone, { body: string; palm: string; outline: string }> = {
  sand: { body: '#F3EDE3', palm: '#E4DBCB', outline: '#D3CAB8' },
  ink: { body: '#2C2C31', palm: '#1F1F23', outline: '#3D3D44' },
  ghost: { body: 'rgba(255,255,255,0.16)', palm: 'rgba(255,255,255,0.1)', outline: 'rgba(255,255,255,0.36)' },
  clay: { body: '#E9A493', palm: '#D94E34', outline: '#C1422B' },
};

interface HandDiagramProps {
  shape: HandShape;
  tone?: DiagramTone;
  className?: string;
  label?: string;
}

/**
 * A sign illustration drawn from the same rig that feeds the recogniser, so the
 * picture on the card and the template in the classifier can never disagree.
 */
export function HandDiagram({ shape, tone = 'sand', className = '', label }: HandDiagramProps) {
  const drawing = useMemo(() => buildHandDrawing(shape), [shape]);
  const colors = TONES[tone];

  return (
    <svg
      viewBox={drawing.viewBox}
      className={className}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g fill={colors.outline} stroke={colors.outline} strokeLinejoin="round" strokeLinecap="round">
        <path d={drawing.palmPath} strokeWidth={0.085} />
        {drawing.parts.map((part) => (
          <path key={`o-${part.name}`} d={part.d} strokeWidth={part.width + 0.085} />
        ))}
      </g>

      <path d={drawing.palmPath} fill={colors.palm} />

      {drawing.parts.map((part) => (
        <path
          key={`b-${part.name}`}
          d={part.d}
          fill="none"
          stroke={colors.body}
          strokeWidth={part.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
