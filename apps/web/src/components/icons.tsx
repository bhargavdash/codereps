import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Check = (p: IconProps) => (
  <Icon {...p}>
    <path
      d="M3 8.5L6.2 12L13 4.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const Cross = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
);

export const ClockAlert = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8.5" r="5.2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 5.5V8.5L10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Icon>
);

export const Flame = ({ size = 16, ...p }: IconProps) => (
  <svg width={(size * 14) / 16} height={size} viewBox="0 0 14 16" fill="none" aria-hidden="true" {...p}>
    <path
      d="M7 1.2C7.6 3.4 9.4 4.2 9.4 6.4c0 .5-.15.95-.4 1.32.8-.2 1.3-.9 1.5-1.5C11.7 7.5 12 9 12 10.2 12 13 9.8 15 7 15S2 13 2 10.2c0-2.5 1.7-3.6 2.1-6C5.4 5 5.6 6 6.2 6.4 5.6 4 6.1 2.4 7 1.2Z"
      fill="currentColor"
    />
  </svg>
);

export const Play = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 3l9 5-9 5V3z" fill="currentColor" />
  </Icon>
);

export const ChevronLeft = (p: IconProps) => (
  <Icon {...p}>
    <path
      d="M10 3.5L5.5 8L10 12.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const ChevronRight = (p: IconProps) => (
  <Icon {...p}>
    <path
      d="M6 3.5L10.5 8L6 12.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const Lock = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5.3 7V5.2a2.7 2.7 0 015.4 0V7" stroke="currentColor" strokeWidth="1.3" />
  </Icon>
);

export const Search = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </Icon>
);

export const FileCode = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 2h4l3 3v9H4V2z" stroke="currentColor" strokeWidth="1.2" />
    <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.2" />
  </Icon>
);

export const Info = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 5V8.5M8 11h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Icon>
);
