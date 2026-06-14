// Dynamic OG image for shared games — the card that unfurls in iMessage/Slack/social.
// Design: MATCHUP is the hero (the universally-understood hook — "Team A vs Team B"),
// the score is a LABELED accent (a cold recipient has no context for a bare "9.2", so it's
// framed as a hook that invites the tap), and the verdict badge translates the number into
// plain language. Anton is embedded so the card carries the real brand type; if the font
// fetch fails, it degrades to the system sans (card still renders, never errors).
import { ImageResponse } from "next/og";
import { TEAMS } from "../../../lib/data";

export const runtime = "edge";
export const alt = "Game matchup scored on CourtVisual";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STAGE = "#0A0D12";
const CREAM = "#ECE7DB";
const ORANGE = "#E1641F";
const FLAME_MID = "#FF5A2C";

const findTeam = (slug) => TEAMS.find((t) => t.slug === slug) || null;
const titleCase = (s) => (s || "").split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

function parse(slug, sp) {
  const safe = decodeURIComponent(slug || "");
  // Score is baked into the slug as a trailing "-s7.7" segment (reliable — the image
  // route always receives the slug; searchParams are not reliably passed to OG routes).
  let body = safe, slugScore = null;
  const sm = safe.match(/^(.*)-s(\d+(?:\.\d+)?)$/);
  if (sm) { body = sm[1]; slugScore = sm[2]; }
  let teamSlug, oppSlug = null, ds = null, single = false;
  if (!body.includes("-vs-")) {
    // Standalone event: no opponent. Peel the trailing date; the rest is the event name.
    const dm = body.match(/^(.*)-(\d{2}-\d{2})$/);
    teamSlug = dm ? dm[1] : body; ds = dm ? dm[2] : null; single = true;
  } else {
    let rest;
    [teamSlug, rest] = body.split("-vs-");
    if (rest) { const m = rest.match(/^(.*)-(\d{2}-\d{2})$/); oppSlug = m ? m[1] : rest; ds = m ? m[2] : null; }
  }
  const team = findTeam(teamSlug), opp = findTeam(oppSlug);
  const sc = parseFloat(slugScore != null ? slugScore : sp?.s);
  const score = !isNaN(sc) && sc > 0 ? Math.max(0, Math.min(10, sc)).toFixed(1) : null;
  const verdict = score == null ? null : +score >= 9.3 ? "HOTTEST TICKET" : +score >= 8.5 ? "MUST SEE" : +score >= 7 ? "HIGHLY RECOMMENDED" : +score >= 5.5 ? "WORTH ATTENDING" : "ON THE SLATE";
  const dateLabel = ds ? new Date(`2026-${ds}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : null;
  const rivalry = sp?.r ? decodeURIComponent(sp.r) : null;
  return {
    teamName: team?.name || titleCase(teamSlug),
    oppName: opp?.name || titleCase(oppSlug),
    single,
    accent: team?.primary || ORANGE,
    score, verdict, dateLabel, rivalry,
  };
}

// Fetch Anton once per render (Vercel caches the edge fetch). Null on failure -> system font.
async function antonFont() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf");
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch { return null; }
}

export default async function Image({ params, searchParams }) {
  const { teamName, oppName, single, accent, score, verdict, dateLabel, rivalry } = parse(params.slug, searchParams);
  const anton = await antonFont();
  const display = anton ? "Anton" : "sans-serif";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", backgroundColor: "#0A0D12", backgroundImage: "repeating-linear-gradient(45deg, rgba(255,160,90,0.022) 0px, rgba(255,160,90,0.022) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(-45deg, rgba(255,160,90,0.022) 0px, rgba(255,160,90,0.022) 1px, transparent 1px, transparent 4px), radial-gradient(85% 75% at 10% 102%, rgba(255,90,44,0.16), rgba(255,90,44,0) 55%), radial-gradient(70% 55% at 82% 0%, rgba(206,224,255,0.10), rgba(206,224,255,0) 60%), linear-gradient(180deg, #14191F 0%, #0C1017 55%, #090B11 100%)", color: CREAM, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "58px 76px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 800, fontFamily: display, letterSpacing: "0.5px" }}>
              Court<span style={{ color: ORANGE }}>Visual</span>
            </div>
            <span style={{ display: "flex", fontSize: 24, color: "rgba(236,231,219,0.5)", marginTop: 4 }}>A fellow fan flagged this game</span>
          </div>
          {(rivalry || dateLabel) && (
            <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, color: "rgba(236,231,219,0.6)" }}>
              {rivalry && <span style={{ display: "flex", color: ORANGE, fontWeight: 600 }}>{rivalry}</span>}
              {rivalry && dateLabel && <span style={{ display: "flex" }}>&middot;</span>}
              {dateLabel && <span style={{ display: "flex" }}>{dateLabel}</span>}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {single ? (
            <div style={{ display: "flex", fontSize: 90, fontWeight: 800, fontFamily: display, lineHeight: 1.0, letterSpacing: "0.5px" }}>{teamName}</div>
          ) : (
            <>
              <div style={{ display: "flex", fontSize: 90, fontWeight: 800, fontFamily: display, lineHeight: 1.0, letterSpacing: "0.5px" }}>{teamName}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 6 }}>
                <span style={{ display: "flex", fontSize: 48, fontWeight: 600, color: "rgba(236,231,219,0.5)", fontFamily: display, letterSpacing: "0.5px" }}>VS</span>
                <span style={{ display: "flex", fontSize: 90, fontWeight: 800, fontFamily: display, lineHeight: 1.0, letterSpacing: "0.5px" }}>{oppName}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {score != null ? (
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <div style={{ display: "flex", position: "relative", width: 160, height: 160, alignItems: "center", justifyContent: "center" }}>
                <svg width="160" height="160" viewBox="0 0 200 200" style={{ position: "absolute" }}>
                  <defs>
                    <linearGradient id="flameRing" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stop-color="#FFA52B" />
                      <stop offset="55%" stop-color="#FF5A2C" />
                      <stop offset="100%" stop-color="#B3122A" />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="88" fill="none" stroke="url(#flameRing)" stroke-width="16" stroke-linecap="round" stroke-dasharray="503 50" transform="rotate(-134 100 100)" />
                </svg>
                <span style={{ display: "flex", fontSize: 76, fontWeight: 800, fontFamily: display, color: "#FFFFFF" }}>{score}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ display: "flex", fontSize: 26, letterSpacing: "2px", color: "rgba(236,231,219,0.55)" }}>EXCITEMENT SCORE</span>
                {verdict && <span style={{ display: "flex", fontSize: 46, fontWeight: 800, fontFamily: display, color: "#FF7A2E", marginTop: 6, letterSpacing: "0.5px" }}>{verdict}</span>}
                <span style={{ display: "flex", fontSize: 30, color: "#FFFFFF", marginTop: 10 }}>Tap to see why &mdash; and where to watch.</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ display: "flex", fontSize: 34, color: "rgba(236,231,219,0.7)" }}>Every game, scored for what excites you.</span>
              <span style={{ display: "flex", fontSize: 30, color: "#FFFFFF", marginTop: 8 }}>Tap to see the score &mdash; and where to watch.</span>
            </div>
          )}
          <div style={{ display: "flex", fontSize: 30, color: "#FFFFFF", fontWeight: 700, alignItems: "flex-end" }}>No boring feeds.</div>
        </div>
      </div>
    ),
    { ...size, fonts: anton ? [{ name: "Anton", data: anton, style: "normal", weight: 400 }] : [] }
  );
}
