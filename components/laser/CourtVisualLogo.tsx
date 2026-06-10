/**
 * CourtVisual wordmark — v6: italic sporty mark.
 *
 * Court (ink) sits beside Visual (heat-gradient — same colors as the score ring,
 * so the wordmark and scoring system speak one color language).
 * White laser traces the outline of Visual with a long, slow stroke.
 * Three speed-lines tail off the final L.
 *
 * Geometry note: word gap is set in *viewBox* units (not letter-spacing) so it
 * never collides with the next word regardless of font-metric drift.
 */

interface CourtVisualLogoProps {
  width?: number;
  className?: string;
  fontFamily?: string;
}

export default function CourtVisualLogo({
  width = 240,
  className = "",
  fontFamily = "'Archivo Black', sans-serif",
}: CourtVisualLogoProps) {
  const style = {
    fontFamily,
    fontSize: 52,
    fontStyle: "italic",
    letterSpacing: "0",
  } as const;

  return (
    <svg
      viewBox="0 0 372 64"
      width={width}
      className={className}
      role="img"
      aria-label="CourtVisual"
    >
      <defs>
        {/* Heat gradient — identical stops to the score ring */}
        <linearGradient id="cv-visual-heat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFA52B" />
          <stop offset="55%" stopColor="#FF5A2C" />
          <stop offset="100%" stopColor="#B3122A" />
        </linearGradient>
      </defs>

      <text x="0" y="50" fill="var(--cv-ink)" style={style}>Court</text>
      <text x="160" y="50" fill="url(#cv-visual-heat)" style={style}>Visual</text>

      {/* Speed-lines off the final L */}
      <g stroke="url(#cv-visual-heat)" strokeLinecap="round">
        <line x1="324" y1="32" x2="352" y2="32" strokeWidth="3.5" />
<line x1="330" y1="44" x2="360" y2="44" strokeWidth="3" />
<line x1="326" y1="55" x2="348" y2="55" strokeWidth="2.5" />
      </g>
    </svg>
  );
}
