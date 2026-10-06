import type { ReactNode, SVGProps } from 'react'

/** Proste ikony liniowe 24×24, rysowane jedną grubością kreski. */
const PATHS: Record<string, ReactNode> = {
  home: <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  chat: <path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4.5 20l1.3-4.3A7.5 7.5 0 1 1 20 12Z" />,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" /></>,
  bell: <><path d="M6.5 16.5V11a5.5 5.5 0 1 1 11 0v5.5l1.5 1.5H5z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></>,
  back: <path d="M15 5 8 12l7 7" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  share: <><path d="M12 15V4M8 8l4-4 4 4" /><path d="M6 11H5v9h14v-9h-1" /></>,
  pin: <><path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0c0 5.4 6.5 11 6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  shield: <><path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
  camera: <><path d="M4 8.5h3l1.8-2.5h6.4L17 8.5h3V19H4z" /><circle cx="12" cy="13.3" r="3.3" /></>,
  send: <path d="M4 12 20 4l-4.5 16-3.8-6.7z" />,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17" /></>,
  download: <><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" /><path d="M5 19.5h14" /></>,
  users: <><circle cx="9" cy="9" r="3.3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M15.5 6a3.2 3.2 0 0 1 0 6.2M17 14.2a5.5 5.5 0 0 1 3.5 4.8" /></>,
  bag: <><path d="M5.5 8.5h13l-1 11.5h-11z" /><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" /></>,
  list: <path d="M8.5 7h11M8.5 12h11M8.5 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01" />,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  truck: <><path d="M3.5 6.5h10v10h-10zM13.5 10h4l3 3.2v3.3h-7" /><circle cx="7.5" cy="17.5" r="1.7" /><circle cx="17" cy="17.5" r="1.7" /></>,
  leaf: <><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z" /><path d="M5 19 13 11" /></>,
  car: <><path d="M4 16.5V12l2-5h12l2 5v4.5z" /><path d="M4 12h16" /><circle cx="7.5" cy="16.5" r="1.8" /><circle cx="16.5" cy="16.5" r="1.8" /></>,
  house: <><path d="M4.5 10.5 12 4.5l7.5 6V20h-15z" /><path d="M10 20v-5.5h4V20" /></>,
  hand: <><path d="M7 13V6.5a1.5 1.5 0 0 1 3 0V12" /><path d="M10 11V5a1.5 1.5 0 0 1 3 0v6" /><path d="M13 11V6a1.5 1.5 0 0 1 3 0v6.5" /><path d="M16 9.5a1.5 1.5 0 0 1 3 0V14a6.5 6.5 0 0 1-11.6 4L4.5 14a1.6 1.6 0 0 1 2.5-2" /></>,
  wrench: <path d="M14.5 6.5a4 4 0 0 0 4.9 5L20 12l-8 8a2.1 2.1 0 0 1-3-3l8-8 .4-.6a4 4 0 0 0-5-4.9l2.6 2.6-1.5 1.5L11 4.9" />,
  sofa: <><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" /><path d="M3.5 12.5a1.5 1.5 0 0 1 3 0V14h11v-1.5a1.5 1.5 0 0 1 3 0V18h-17zM5.5 18v1.5M18.5 18v1.5" /></>,
  shirt: <path d="M9 4.5 4 7l1.5 4L8 10v9.5h8V10l2.5 1L20 7l-5-2.5a3 3 0 0 1-6 0Z" />,
  stroller: <><path d="M5 6h3l2 7h9a6 6 0 0 0-6-6V6" /><path d="M10 13l-1 3h9" /><circle cx="9" cy="18.5" r="1.5" /><circle cx="17" cy="18.5" r="1.5" /></>,
  phone: <><rect x="7" y="3.5" width="10" height="17" rx="2" /><path d="M11 17.5h2" /></>,
  bike: <><circle cx="6.5" cy="15.5" r="3.5" /><circle cx="17.5" cy="15.5" r="3.5" /><path d="M6.5 15.5 10 9h5.5l2 6.5M10 9 8.5 6.5h-2M12.5 15.5 15.5 9" /></>,
  tent: <><path d="M3 19.5 12 5l9 14.5z" /><path d="M12 5v14.5M9 19.5l3-5 3 5" /></>,
  paw: <><circle cx="7" cy="10" r="1.8" /><circle cx="10.5" cy="6.5" r="1.8" /><circle cx="14.5" cy="6.5" r="1.8" /><circle cx="18" cy="10" r="1.8" /><path d="M12.5 11.5c-3 0-5.5 3.5-5.5 5.7 0 1.6 1.4 2.3 2.8 2l2.7-.6 2.7.6c1.4.3 2.8-.4 2.8-2 0-2.2-2.5-5.7-5.5-5.7z" /></>,
  drop: <path d="M12 3.5c3.5 4.2 6 7.6 6 10.6a6 6 0 0 1-12 0c0-3 2.5-6.4 6-10.6Z" />,
  more: <><circle cx="5.5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="18.5" cy="12" r="1.2" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
  eyeoff: <><path d="M3 3l18 18" /><path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c5 0 8.5 4.5 9 6-.3.9-1.3 2.5-3 3.8M6.5 7.6C4.6 8.9 3.4 10.7 3 12c.5 1.5 4 6 9 6 1.4 0 2.7-.3 3.8-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  store: <><path d="M4 9.5 5.5 4.5h13L20 9.5" /><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path d="M5.5 12v8h13v-8" /></>,
  card: <><rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="M3.5 10h17" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  doc: <><path d="M7 3.5h7l4 4V20.5H7z" /><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6" /></>,
  minus: <path d="M5 12h14" />,
  box: <><path d="M4 8 12 4l8 4v8.5L12 20.5l-8-4z" /><path d="M4 8l8 4 8-4M12 12v8.5" /></>,
  sparkle: <><path d="M12 3.5c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z" /><path d="M19 3v3M17.5 4.5h3" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  cloud: <path d="M7 18.5h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 18.5Z" />,
  rain: <><path d="M7 15h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 15Z" /><path d="M8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5" /></>,
  snow: <><path d="M7 15h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 15Z" /><path d="M8.5 19h.01M12 20.5h.01M15.5 19h.01" /></>,
  storm: <><path d="M7 15h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 15Z" /><path d="m12.5 15-2 3.5h3l-2 3" /></>,
  fog: <path d="M4 9h16M6 13h12M4 17h16" />,
  route: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16" /></>,
}

export function Icon({ name, size = 22, ...props }: { name: string; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {PATHS[name] ?? PATHS.box}
    </svg>
  )
}

/** Znak: planeta (Ty) i ktoś na Twojej orbicie. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden>
      <rect width="96" height="96" rx="24" fill="var(--accent)" />
      <ellipse cx="48" cy="48" rx="33" ry="15" fill="none" stroke="var(--ink)" strokeWidth="5" transform="rotate(-28 48 48)" />
      <circle cx="48" cy="48" r="14" fill="var(--ink)" />
      <circle cx="77" cy="32.5" r="8" fill="var(--primary)" stroke="var(--accent)" strokeWidth="3" />
    </svg>
  )
}
