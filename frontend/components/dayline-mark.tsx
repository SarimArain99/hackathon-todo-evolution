import { useId } from "react";

/**
 * The Dayline mark — the clock dial: a glossy green gauge ring with tick
 * marks and a glowing "now" dot, on a dark teal tile. A clean SVG redraw
 * of the generated clock-dial logo Muhammad picked, so it stays crisp at
 * every size and needs no binary asset.
 *
 * Gradient IDs are unique per instance (useId): pages like sign-in render
 * this logo twice, and duplicate IDs make the paint servers fail.
 */
export function DaylineMark({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const tileId = `dayline-tile-${uid}`;
  const ringId = `dayline-ring-${uid}`;
  const dotId = `dayline-dot-${uid}`;
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i * 6 * Math.PI) / 180;
    const long = i % 5 === 0;
    const r1 = long ? 20.5 : 22;
    const r2 = 24.5;
    return {
      x1: 50 + r1 * Math.cos(a),
      y1: 50 + r1 * Math.sin(a),
      x2: 50 + r2 * Math.cos(a),
      y2: 50 + r2 * Math.sin(a),
      long,
    };
  });
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={tileId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#013240" />
          <stop offset="100%" stopColor="#002029" />
        </linearGradient>
        <linearGradient id={ringId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#015c4d" />
          <stop offset="45%" stopColor="#419c80" />
          <stop offset="100%" stopColor="#03f36e" />
        </linearGradient>
        <radialGradient id={dotId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#08e284" />
          <stop offset="100%" stopColor="#08e284" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" rx="16" fill={`url(#${tileId})`} />
      <circle cx="50" cy="50" r="31" fill="none" stroke={`url(#${ringId})`} strokeWidth="8" />
      {/* gloss highlight on the upper ring */}
      <path
        d="M 28 30 A 31 31 0 0 1 72 26"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.28"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="#2ecc71"
          strokeOpacity={t.long ? 0.9 : 0.65}
          strokeWidth={t.long ? 1 : 0.7}
          strokeLinecap="round"
        />
      ))}
      <circle cx="63" cy="29" r="6.5" fill={`url(#${dotId})`} />
      <circle cx="63" cy="29" r="3" fill="#08e284" />
    </svg>
  );
}
