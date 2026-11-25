/* A small set of line icons (1.6 px stroke) in the spirit of Phosphor Regular. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const Icon = {
  Arrow: (p: P) => (<svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>),
  Chevron: (p: P) => (<svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>),
  Check: (p: P) => (<svg {...base} {...p}><path d="m5 12.5 4.2 4.2L19 7" /></svg>),
  Menu: (p: P) => (<svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>),
  Close: (p: P) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>),
  Match: (p: P) => (<svg {...base} {...p}><circle cx="8" cy="12" r="4" /><circle cx="16" cy="12" r="4" /></svg>),
  Split: (p: P) => (<svg {...base} {...p}><path d="M4 12h6M10 12l5-5h5M10 12l5 5h5M17 4l3 3-3 3M17 14l3 3-3 3" /></svg>),
  Receipt: (p: P) => (<svg {...base} {...p}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>),
  Chat: (p: P) => (<svg {...base} {...p}><path d="M4 19.5 5.3 16A8 8 0 1 1 8 18.7z" /><path d="M9 11h6M9 14h4" /></svg>),
  Calendar: (p: P) => (<svg {...base} {...p}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /><path d="m9 15 2 2 4-4" /></svg>),
  Heart: (p: P) => (<svg {...base} {...p}><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z" /></svg>),
  Chart: (p: P) => (<svg {...base} {...p}><path d="M4 20h16" /><rect x="6" y="11" width="3" height="6" rx="1" /><rect x="11" y="7" width="3" height="10" rx="1" /><rect x="16" y="4" width="3" height="13" rx="1" /></svg>),
  Bell: (p: P) => (<svg {...base} {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>),
  Shield: (p: P) => (<svg {...base} {...p}><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z" /><path d="m8.8 12 2.2 2.2 4.4-4.4" /></svg>),
  Lock: (p: P) => (<svg {...base} {...p}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 1 1 8 0v2.5" /></svg>),
  Eye: (p: P) => (<svg {...base} {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>),
  Bank: (p: P) => (<svg {...base} {...p}><path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18" /></svg>),
  Phone: (p: P) => (<svg {...base} {...p}><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>),
  Users: (p: P) => (<svg {...base} {...p}><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 19.5c.8-3.3 3.3-5 6.5-5s5.7 1.7 6.5 5" /><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.8c1.8.6 3 2.2 3.5 4.7" /></svg>),
  Gate: (p: P) => (<svg {...base} {...p}><path d="M4 21V8l8-5 8 5v13" /><path d="M8 21v-8h8v8M12 13v8" /></svg>),
  Clock: (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>),
  Book: (p: P) => (<svg {...base} {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></svg>),
  Globe: (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.7 5.5 3.7 8.5s-1.2 5.9-3.7 8.5c-2.5-2.6-3.7-5.5-3.7-8.5S9.5 6.1 12 3.5z" /></svg>),
  Sparkle: (p: P) => (<svg {...base} {...p}><path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2z" /></svg>),
  Plus: (p: P) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>),
};
