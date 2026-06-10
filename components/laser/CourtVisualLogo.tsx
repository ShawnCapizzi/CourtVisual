/**
 * CourtVisual wordmark — v7: measured geometry.
 *
 * All positions computed from Archivo Black's real font metrics (fontTools):
 *   'Court'  @52px advance = 156.0px
 *   'Visual' @52px advance = 176.2px  -> starts x=164 (8px gap), ends x=340.2
 *   capHeight @52px = 35.8px          -> baseline 40, caps top ~4.2
 *
 * Italic comes from an explicit skewX(-12) (Archivo Black has no true italic;
 * browser-synthesized oblique varies and overflows). translate(9,0) compensates
 * the skew's leftward shift at baseline (tan 12deg * 40 = 8.5).
 *
 * viewBox 0 0 390 46 hugs the content: glyphs end ~348, speed lines end ~386.
 */

interface CourtVisualLogoProps {
  width?: number;
  className?: string;
  fontFamily?: string;
}

export default function CourtVisualLogo({
  width = 170,
  className = "",
  fontFamily = "'Archivo Black', sans-serif",
}: CourtVisualLogoProps) {
  const style = { fontFamily, fontSize: 52, letterSpacing: "0" } as const;

  return (
    <svg
      viewBox="0 0 390 46"
      width={width}
      className={className}
      role="img"
      aria-label="CourtVisual"
    >
      <defs>
        <linearGradient id="cv-visual-heat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFA52B" />
          <stop offset="55%" stopColor="#FF5A2C" />
          <stop offset="100%" stopColor="#B3122A" />
        </linearGradient>
        {/* Lines need userSpaceOnUse: bounding-box gradients don't render on zero-height elements */}
        <linearGradient id="cv-speed-heat" x1="346" y1="0" x2="384" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5A2C" />
          <stop offset="100%" stopColor="#B3122A" />
        </linearGradient>
      </defs>

      <g transform="translate(9 0) skewX(-12)">
        <text x="0" y="40" fill="var(--cv-ink)" style={style}>Court</text>
        <text x="164" y="40" fill="url(#cv-visual-heat)" style={style}>Visual</text>

        {/* Speed lines — start after Visual's measured end (340), clear of glyphs */}
        <g stroke="url(#cv-speed-heat)" strokeLinecap="round">
          <line x1="348" y1="14" x2="374" y2="14" strokeWidth="3.5" />
          <line x1="352" y1="25" x2="382" y2="25" strokeWidth="3" />
          <line x1="350" y1="35" x2="372" y2="35" strokeWidth="2.5" />
        </g>
      </g>
    </svg>
  );
}
