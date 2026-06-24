// Single source of truth for the CourtVisual header. Used by both the in-app
// shell (button mode: switches views via setView) and the standalone /about route
// (link mode: navigates to "/"). Because both import THIS, the header can never
// drift between surfaces — change it here, both update.
import React from "react";
import { Settings } from "lucide-react";

const ON = "#ECE7DB";
const ON_MUTED = "rgba(236,231,219,0.60)";
const CREAM = "#ECE7DB";
const INK = "#16130F";

export function LogoPlate() {
  return (
    <span style={{ fontFamily: "'Anton','Archivo Black',sans-serif", fontSize: "clamp(18px, 5vw, 23px)", lineHeight: 1, letterSpacing: "0.01em", color: ON, whiteSpace: "nowrap" }}>
      Court<span style={{ color: "#E1641F" }}>Visual</span>
    </span>
  );
}

// pillBg/border are the exact in-app values so the two surfaces are pixel-identical.
const groupWrap = { display: "inline-flex", gap: 4, padding: 3, background: "rgba(255,255,255,0.07)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 };
const gearBase = { width: 44, height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, cursor: "pointer" };

// view/setView present → app (button) mode. Absent → link mode (the /about route).
export default function SiteHeader({ view, setView }) {
  const linkMode = !setView;

  const gamesOn = !linkMode && view === "games";
  const settingsOn = !linkMode && view === "settings";

  const gamesPillStyle = (on) => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 38, textDecoration: "none", border: "none", cursor: "pointer", fontFamily: "'Archivo',sans-serif", fontSize: 12, fontWeight: 600, padding: "0 13px", borderRadius: 9, background: on ? CREAM : "transparent", color: on ? INK : ON_MUTED, boxShadow: on ? "0 1px 3px rgba(0,0,0,0.35)" : "none" });
  const gearStyle = (on) => ({ ...gearBase, background: on ? CREAM : "rgba(255,255,255,0.07)", color: on ? INK : ON_MUTED, textDecoration: "none" });

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 18, minWidth: 0 }}>
      {linkMode
        ? <a href="/" style={{ textDecoration: "none", minWidth: 0, overflow: "hidden" }}><LogoPlate /></a>
        : <span style={{ minWidth: 0, overflow: "hidden" }}><LogoPlate /></span>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={groupWrap}>
          {linkMode
            ? <a href="/" style={gamesPillStyle(false)}>My Games</a>
            : <button onClick={() => setView("games")} style={gamesPillStyle(gamesOn)}>My Games</button>}
          <a href="/about" style={gamesPillStyle(linkMode)}>About</a>
        </div>
        {linkMode
          ? <a href="/?view=settings" aria-label="Settings" style={gearStyle(false)}><Settings size={17} /></a>
          : <button aria-label="Settings" onClick={() => setView("settings")} style={gearStyle(settingsOn)}><Settings size={17} /></button>}
      </div>
    </div>
  );
}
