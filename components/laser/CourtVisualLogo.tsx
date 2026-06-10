/**
 * CourtVisual wordmark — v8: WebKit-safe gradient.
 *
 * "Visual" is colored by clipping a gradient-filled <rect> to the text shape,
 * instead of filling the <text> with the gradient directly. Gradient-on-text
 * inside a transformed group renders inconsistently in mobile WebKit (colorless
 * "Visual"); gradient-on-rect-with-text-clip is reliable everywhere.
 *
 * Geometry from Archivo Black metrics: Court advance 156 @52px, Visual 176.2,
 * Visual starts x=164. Italic via explicit skewX(-12). Generous viewBox margins.
 */

import { useId } from "react";

interface CourtVisualLogoProps {
  width?: number;
  className?: string;
  fontFamily?: string;
}

export default function CourtVisualLogo({
  width = 185,
  className = "",
  fontFamily = "'Archivo Black', sans-serif",
}: CourtVisualLogoProps) {
  const style = { fontFamily, fontSize: 52, letterSpacing: "0" } as const;
  const uid = useId().replace(/[:]/g, "");
  const heatId = `cv-heat-${uid}`;
  const speedId = `cv-speed-${uid}`;
  const clipId = `cv-clip-${uid}`;

  return (
    <svg
      viewBox="0 0 410 56"
      width={width}
      className={className}
      role="img"
      aria-label="CourtVisual"
    >
      <defs>
        <linearGradient id={heatId} x1="164" y1="2" x2="340" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFA52B" />
          <stop offset="55%" stopColor="#FF5A2C" />
          <stop offset="100%" stopColor="#B3122A" />
        </linearGradient>
        <linearGradient id={speedId} x1="346" y1="0" x2="384" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5A2C" />
          <stop offset="100%" stopColor="#B3122A" />
        </linearGradient>
        {/* Clip = the "Visual" glyph shapes; the gradient rect shows through it. */}
        <clipPath id={clipId}>
          <text x="164" y="40" style={style}>Visual</text>
        </clipPath>
      </defs>

      <g transform="translate(14 6) skewX(-12)">
        <text x="0" y="40" fill="var(--cv-ink)" style={style}>Court</text>

        {/* Gradient-filled rect, clipped to the Visual text — WebKit-safe color */}
        <rect x="160" y="-6" width="200" height="56" fill={`url(#${heatId})`} clipPath={`url(#${clipId})`} />

        {/* Speed lines tailing off the final L */}
        <g stroke={`url(#${speedId})`} strokeLinecap="round">
          <line x1="348" y1="14" x2="374" y2="14" strokeWidth="3.5" />
          <line x1="352" y1="25" x2="382" y2="25" strokeWidth="3" />
          <line x1="350" y1="35" x2="372" y2="35" strokeWidth="2.5" />
        </g>
      </g>
    </svg>
  );
}
