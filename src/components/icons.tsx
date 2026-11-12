import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});

export const CameraIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a2 2 0 0 0 1.7-.95l.5-.8A2 2 0 0 1 10.6 3.3h2.8a2 2 0 0 1 1.7.95l.5.8A2 2 0 0 0 17.3 6h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
    <circle cx="12" cy="12.4" r="3.4" />
  </svg>
);

export const SwitchCameraIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h.9l.9-1.4A1.6 1.6 0 0 1 9.8 4h4.4a1.6 1.6 0 0 1 1.4.7L16.5 6h1A2.5 2.5 0 0 1 20 8.5v1.2" />
    <path d="M20 15.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 15.5v-1" />
    <path d="M17.6 12.2 20 9.7l2.4 2.4" opacity="0" />
    <path d="M9.2 13.2a2.8 2.8 0 0 1 5.4-.6" />
    <path d="m16.4 11.2-.6-2.2-2.2.6" />
    <path d="M14.8 15.4a2.8 2.8 0 0 1-5.4.6" />
    <path d="m7.6 17.4.6 2.2 2.2-.6" />
  </svg>
);

export const MirrorIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3v18" strokeDasharray="2 3" />
    <path d="M8.6 6.5 4 12l4.6 5.5z" />
    <path d="M15.4 6.5 20 12l-4.6 5.5z" />
  </svg>
);

export const SkeletonIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="4.6" r="1.5" />
    <path d="M12 6.1v5.4" />
    <path d="M12 7.6 7 9.4M12 7.6l5 1.8" />
    <path d="M7 9.4v4.2M17 9.4v4.2" />
    <path d="M12 11.5v5.9" />
    <path d="m12 17.4-3.4 3M12 17.4l3.4 3" />
  </svg>
);

export const SpeakerIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M11 5.5 6.8 8.8H4.2a1 1 0 0 0-1 1v4.4a1 1 0 0 0 1 1h2.6L11 18.5z" />
    <path d="M15 9.2a4 4 0 0 1 0 5.6" />
    <path d="M17.7 6.7a7.5 7.5 0 0 1 0 10.6" />
  </svg>
);

export const BackspaceIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M9 5h10.5A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5H9l-6-7z" />
    <path d="m12.5 9.5 5 5M17.5 9.5l-5 5" />
  </svg>
);

export const SpaceIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M4 14.5v1.8A1.7 1.7 0 0 0 5.7 18h12.6a1.7 1.7 0 0 0 1.7-1.7v-1.8" />
    <path d="M10 9.5v5M14 9.5v5" opacity="0.45" />
  </svg>
);

export const TrashIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
    <path d="M10.5 10.5v6M13.5 10.5v6" opacity="0.5" />
  </svg>
);

export const SearchIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="m15.6 15.6 4.1 4.1" />
  </svg>
);

export const ArrowRightIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M4.5 12h14" />
    <path d="m13 6.5 5.5 5.5-5.5 5.5" />
  </svg>
);

export const ArrowUpRightIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M6.5 17.5 17.5 6.5" />
    <path d="M8.5 6.5h9v9" />
  </svg>
);

export const CloseIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const CheckIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="m4.5 12.8 4.6 4.4L19.5 6.6" />
  </svg>
);

export const InfoIcon = ({ size = 15, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const LockIcon = ({ size = 13, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" />
  </svg>
);

export const SparkIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3.5v3M12 17.5v3M4.5 12h3M16.5 12h3" />
    <path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z" opacity="0.5" />
  </svg>
);

export const PlayIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M8 5.4 18.5 12 8 18.6z" />
  </svg>
);

export const HandGlyph = ({ size = 20, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M8 18.5V11a1.4 1.4 0 0 1 2.8 0v2.5" />
    <path d="M10.8 13.5v-5a1.4 1.4 0 0 1 2.8 0v5" />
    <path d="M13.6 13.5V9.8a1.4 1.4 0 0 1 2.8 0v5.4" />
    <path d="M16.4 12.5c0-1 .8-1.6 1.8-1.3.7.2 1.1.9 1.1 1.7v2.3c0 2.4-2.1 4.3-4.6 4.3h-1.2c-1.5 0-2.3-.7-3.4-2l-1.7-2.3c-.6-.8-.2-1.9.8-2.1.6-.1 1.2.1 1.6.6l.7.8" />
  </svg>
);
