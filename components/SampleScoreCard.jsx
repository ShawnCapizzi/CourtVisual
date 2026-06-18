// A static "this is what a scored game looks like" moment for the server-rendered
// About and Glossary pages. The score is computed by the real engine (scoreOf +
// verdict on the default weights), so it can't drift from the product. Self-contained
// (its own Ring + surface) so it never pulls the client app bundle onto these pages.
import { Flame } from "lucide-react";
import { scoreOf, verdict, DEFAULT_WEIGHTS } from "../lib/data";

const DEPTH = "0 1px 2px rgba(18,20,28,0.07), 0 6px 16px rgba(18,20,28,0.10), 0 22px 48px rgba(18,20,28,0.12)";
const SETUP_CARD = {
  borderRadius: 22, padding: 18, position: "relative", overflow: "hidden", backgroundColor: "#171B23",
  backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 4px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 4px), radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,0.10), rgba(255,255,255,0) 55%)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: `${DEPTH}, inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -46px 70px rgba(0,0,0,0.40)`,
};

function Ring({ value, size = 66 }) {
  const c = size / 2, R = size * (27 / 66), C = 2 * Math.PI * R, frac = Math.max(0, Math.min(1, value / 10));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="scRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA52B" /><stop offset="55%" stopColor="#FF5A2C" /><stop offset="100%" stopColor="#B3122A" />
        </linearGradient>
      </defs>
      <circle cx={c} cy={c} r={R} fill="none" strokeWidth={size * (5 / 66)} stroke="rgba(255,255,255,0.13)" />
      <circle cx={c} cy={c} r={R} fill="none" strokeWidth={size * (5.5 / 66)} stroke="url(#scRingGrad)" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform={`rotate(-90 ${c} ${c})`} />
      <circle cx={c} cy={c} r={R - size * (2.75 / 66)} fill="#13141A" />
      <text x={c} y={c} textAnchor="middle" dominantBaseline="central" className="g-display" fontSize={size * (17 / 66)} fill="#FF7A2E">{value.toFixed(1)}</text>
    </svg>
  );
}

export default function SampleScoreCard({ title = "RIVALRY NIGHT", caption = "A sample game, scored for excitement", note, style }) {
  const demo = { tag: "Rivalry night", playoff: 6, rivalry: 9, hot: 7, historic: 8, topRivals: true };
  const score = scoreOf(demo, DEFAULT_WEIGHTS);
  return (
    <div className="cv-gleam" style={{ ...SETUP_CARD, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
        <Ring value={score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="g-display" style={{ fontSize: 18, color: "#ECE7DB", lineHeight: 1.08 }}>{title}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 999, background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: 700 }}><Flame size={10} /> {verdict(score)}</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(236,231,219,0.6)", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{caption}</div>
        </div>
      </div>
      {note && <div style={{ fontSize: 11.5, color: "rgba(236,231,219,0.4)", marginTop: 14, lineHeight: 1.45 }}>{note}</div>}
    </div>
  );
}
