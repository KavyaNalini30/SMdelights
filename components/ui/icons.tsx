// Small inline icon set (stroke icons, inherit currentColor). Decorative by default.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const s = (p: P) => ({
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const BagIcon = (p: P) => (
  <svg {...s(p)}><path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
);
export const MenuIcon = (p: P) => (
  <svg {...s(p)}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
);
export const CloseIcon = (p: P) => (
  <svg {...s(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const UserIcon = (p: P) => (
  <svg {...s(p)}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" /></svg>
);
export const ArrowRightIcon = (p: P) => (
  <svg {...s(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ClockIcon = (p: P) => (
  <svg {...s(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const TruckIcon = (p: P) => (
  <svg {...s(p)}><path d="M3 6.5h11v9H3zM14 10h3.5l3 3v2.5H14" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>
);
export const GiftIcon = (p: P) => (
  <svg {...s(p)}><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" /><path d="M12 7S10.5 3.5 8 4.2C6.3 4.7 7 7 7 7M12 7s1.5-3.5 4-2.8C17.7 4.7 17 7 17 7" /></svg>
);
export const HeartIcon = (p: P) => (
  <svg {...s(p)}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>
);
export const LeafIcon = (p: P) => (
  <svg {...s(p)}><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" /><path d="M5 19 13 11" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...s(p)}><path d="m5 12.5 4.2 4L19 7" /></svg>
);
export const MinusIcon = (p: P) => (
  <svg {...s(p)}><path d="M6 12h12" /></svg>
);
export const PlusIcon = (p: P) => (
  <svg {...s(p)}><path d="M12 6v12M6 12h12" /></svg>
);
export const StarIcon = ({ filled = true, ...p }: P & { filled?: boolean }) => (
  <svg {...s({ ...p, fill: filled ? "currentColor" : "none", strokeWidth: 1.2 })}>
    <path d="m12 3.8 2.5 5.2 5.6.7-4.1 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.7z" />
  </svg>
);
export const SnowflakeIcon = (p: P) => (
  <svg {...s(p)}><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" /></svg>
);
export const InstagramIcon = (p: P) => (
  <svg {...s(p)}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" /></svg>
);
export const WhatsAppIcon = (p: P) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.3-2.9c-.2-.4.3-.4.7-1.2.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.8 2c0 1.2.9 2.3 1 2.5.1.2 1.7 2.7 4.2 3.7 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.2l-.4-.2Z" />
  </svg>
);
