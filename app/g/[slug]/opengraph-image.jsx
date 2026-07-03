// Per-game share card — /g/[slug]/opengraph-image
// The first thing a cold recipient sees, so it explains CourtVisual in one glance: the brand flame
// score ring as the hero, the verdict, the matchup, and a large plain line telling a stranger what
// the app is. The ring is ALWAYS the flame gradient (never team color); team color appears only on
// the edge, verdict pill, and url. Resolves the game straight from the slug (same shape the share
// page decodes), so the card needs no lookup and never throws.
import { ImageResponse } from "next/og";
import { createElement as h } from "react";
import { TEAMS } from "../../../lib/data";

export const alt = "A CourtVisual game score — how worth watching tonight's game is, 0 to 10.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ---- fonts: Archivo, fetched once and reused across renders (the image itself is CDN-cached) ----
const FONT_BASE = "https://cdn.jsdelivr.net/npm/@fontsource/archivo/files";
const FW = [400, 600, 700, 800];
let _fonts = null;
async function fonts() {
  if (_fonts) return _fonts;
  const bufs = await Promise.all(FW.map((w) => fetch(`${FONT_BASE}/archivo-latin-${w}-normal.woff`).then((r) => r.arrayBuffer())));
  _fonts = FW.map((w, i) => ({ name: "Archivo", weight: w, style: "normal", data: bufs[i] }));
  return _fonts;
}

// ---- slug -> game (mirrors app/g/[slug]/page.jsx so the card matches the landing page) ----
const ORANGE = "#E1641F";
function parseSlug(slug) {
  const raw = decodeURIComponent(slug || "");
  let safe = raw, slugScore = null;
  const sm = raw.match(/^(.*)-s(\d+(?:\.\d+)?)$/);
  if (sm) { safe = sm[1]; slugScore = sm[2]; }
  if (!safe.includes("-vs-")) {
    const dm = safe.match(/^(.*)-(\d{2}-\d{2})$/);
    return { teamSlug: dm ? dm[1] : safe, oppSlug: null, ds: dm ? dm[2] : null, slugScore, single: true };
  }
  const [teamSlug, rest] = safe.split("-vs-");
  const m = rest.match(/^(.*)-(\d{2}-\d{2})$/);
  return { teamSlug, oppSlug: m ? m[1] : rest, ds: m ? m[2] : null, slugScore, single: false };
}
const findTeam = (slug) => TEAMS.find((t) => t.slug === slug) || null;
const titleCase = (s) => (s || "").split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
function resolve(slug) {
  const { teamSlug, oppSlug, ds, slugScore, single } = parseSlug(slug);
  const team = findTeam(teamSlug);
  const opp = findTeam(oppSlug);
  const teamName = team?.name || titleCase(teamSlug);
  const oppName = opp?.name || titleCase(oppSlug);
  const s = parseFloat(slugScore);
  const score = !isNaN(s) ? Math.max(0, Math.min(10, s)).toFixed(1) : null;
  const verdict = score == null ? null : +score >= 9.3 ? "Hottest ticket" : +score >= 8.5 ? "Must see" : +score >= 7 ? "Highly recommended" : +score >= 5.5 ? "Worth attending" : "On the slate";
  const dateLabel = ds ? new Date(`2026-${ds}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
  return { teamName, oppName, score, verdict, dateLabel, accent: team?.primary || ORANGE, single, eventName: single ? teamName : null };
}

// ---- palette + color helpers ----
const STAGE = "#0A0D12";
const CREAM = "#ECE7DB";
const muted = "rgba(236,231,219,0.62)";
const FLAME = ["#FFA52B", "#FF5A2C", "#B3122A"]; // the signature score-ring flame, same on every card
const FLAME_TEXT = "#FF7A2E";
const hx = (n) => n.toString(16).padStart(2, "0");
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const a = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function mix(a, b, t) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const r = Math.round(((A >> 16) & 255) * (1 - t) + ((B >> 16) & 255) * t);
  const g = Math.round(((A >> 8) & 255) * (1 - t) + ((B >> 8) & 255) * t);
  const bl = Math.round((A & 255) * (1 - t) + (B & 255) * t);
  return `#${hx(r)}${hx(g)}${hx(bl)}`;
}
const textOn = (hex) => (lum(hex) > 0.5 ? STAGE : CREAM);
const accentUI = (hex) => (lum(hex) < 0.16 ? mix(hex, CREAM, 0.5) : hex);
function nameSize(a, b) {
  const n = Math.max((a || "").length, (b || "").length);
  if (n > 13) return 42;
  if (n > 10) return 52;
  if (n > 8) return 60;
  return 68;
}

// Brand score ring: flame gradient progress arc filled to score/10, flame-orange numeral. Always
// flame. SVG mirrors the app's ScoreRing; the number is an overlaid div (Satori lays out div text
// reliably, unlike SVG <text>).
function flameRing(size, scoreStr) {
  const v = Number(scoreStr) || 0;
  const c = size / 2, R = size * (27 / 66), C = 2 * Math.PI * R, frac = Math.max(0, Math.min(1, v / 10));
  const svg = h("svg", { key: "svg", width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: { position: "absolute", top: 0, left: 0 } }, [
    h("defs", { key: "d" }, [
      h("linearGradient", { key: "g", id: "cvRingGrad", x1: "0%", y1: "0%", x2: "100%", y2: "100%" }, [
        h("stop", { key: 0, offset: "0%", "stop-color": FLAME[0] }),
        h("stop", { key: 1, offset: "55%", "stop-color": FLAME[1] }),
        h("stop", { key: 2, offset: "100%", "stop-color": FLAME[2] }),
      ]),
      h("radialGradient", { key: "w", id: "cvRingWell", cx: "50%", cy: "40%", r: "62%" }, [
        h("stop", { key: 0, offset: "0%", "stop-color": "#13151A" }),
        h("stop", { key: 1, offset: "58%", "stop-color": "#0D0E12" }),
        h("stop", { key: 2, offset: "100%", "stop-color": "#07080B" }),
      ]),
    ]),
    h("circle", { key: "track", cx: c, cy: c, r: R, fill: "none", strokeWidth: size * (5 / 66), stroke: "rgba(255,255,255,0.13)" }),
    h("circle", { key: "arc", cx: c, cy: c, r: R, fill: "none", strokeWidth: size * (5.5 / 66), stroke: "url(#cvRingGrad)", strokeLinecap: "round", strokeDasharray: C, strokeDashoffset: C * (1 - frac), transform: `rotate(-90 ${c} ${c})` }),
    h("circle", { key: "well", cx: c, cy: c, r: R - size * (2.75 / 66), fill: "url(#cvRingWell)" }),
  ]);
  return h("div", { key: "ring", style: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, width: size, height: size } }, [
    svg,
    h("div", { key: "n", style: { display: "flex", fontSize: Math.round(size * 0.32), fontWeight: 800, color: FLAME_TEXT, lineHeight: 1, letterSpacing: "-0.03em" } }, scoreStr),
    h("div", { key: "o", style: { display: "flex", fontSize: 18, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(236,231,219,0.5)", marginTop: 6 } }, "OUT OF 10"),
  ]);
}

function buildTree(d) {
  const accent = accentUI(d.accent || ORANGE);
  const onAccent = textOn(accent);
  const hasScore = d.score != null && Number(d.score) > 0;
  const ns = d.single ? Math.min(64, nameSize(d.eventName, "")) : nameSize(d.teamName, d.oppName);
  const RING = 270;

  const bg = [
    h("div", { key: "glow", style: { position: "absolute", top: 0, left: 0, width: 1200, height: 630, backgroundImage: "radial-gradient(680px 460px at 15% -12%, rgba(255,120,44,0.14), transparent 62%)" } }),
    h("div", { key: "mesh", style: { position: "absolute", top: 0, left: 0, width: 1200, height: 630, backgroundImage: "repeating-linear-gradient(135deg, rgba(236,231,219,0.05) 0px, rgba(236,231,219,0.05) 1px, transparent 1px, transparent 10px)" } }),
    h("div", { key: "edge", style: { position: "absolute", left: 0, top: 0, width: 10, height: 630, background: accent } }),
  ];

  const header = h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, [
    h("div", { key: "w", style: { display: "flex", alignItems: "baseline", fontSize: 34, fontWeight: 800, letterSpacing: "-0.01em" } }, [
      h("span", { key: "a", style: { color: CREAM } }, "Court"),
      h("span", { key: "b", style: { color: ORANGE } }, "Visual"),
    ]),
    h("div", { key: "ctx", style: { display: "flex", alignItems: "center", fontSize: 27, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: CREAM, background: "rgba(255,255,255,0.055)", border: "1px solid rgba(236,231,219,0.18)", borderRadius: 10, padding: "8px 16px" } }, d.dateLabel || "Scored on CourtVisual"),
  ]);

  const matchupLines = d.single
    ? [h("div", { key: "n", style: { display: "flex", fontSize: ns, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.02, color: CREAM } }, d.eventName || "")]
    : [
        h("div", { key: "t", style: { display: "flex", fontSize: ns, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.02, color: CREAM } }, d.teamName || ""),
        h("div", { key: "o", style: { display: "flex", alignItems: "baseline", gap: 14 } }, [
          h("span", { key: "vs", style: { fontSize: Math.round(ns * 0.6), fontWeight: 700, color: muted } }, "vs"),
          h("span", { key: "opp", style: { fontSize: ns, fontWeight: 800, letterSpacing: "-0.02em", color: CREAM } }, d.oppName || ""),
        ]),
      ];

  const right = h("div", { key: "right", style: { display: "flex", flexDirection: "column", gap: 18 } }, [
    d.verdict ? h("div", { key: "v", style: { display: "flex", alignSelf: "flex-start", background: accent, color: onAccent, fontSize: 24, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", padding: "9px 18px", borderRadius: 11 } }, d.verdict) : null,
    h("div", { key: "m", style: { display: "flex", flexDirection: "column", gap: 2 } }, matchupLines),
  ].filter(Boolean));

  const hero = hasScore
    ? h("div", { style: { display: "flex", alignItems: "center", gap: 56 } }, [flameRing(RING, d.score), right])
    : h("div", { style: { display: "flex", flexDirection: "column", gap: 14, maxWidth: 940 } }, [
        h("div", { key: "eh", style: { display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: FLAME_TEXT } }, "Is it worth watching?"),
        h("div", { key: "m", style: { display: "flex", flexDirection: "column", gap: 2 } }, matchupLines),
      ]);

  // Enlarged tagline: the cold-reader hook, now the dominant footer line. URL sits under it, quiet.
  const footer = h("div", { style: { display: "flex", flexDirection: "column", gap: 9, borderTop: "1px solid rgba(236,231,219,0.14)", paddingTop: 24 } }, [
    h("div", { key: "e", style: { display: "flex", fontSize: 37, fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.05, color: "rgba(236,231,219,0.92)" } }, "Every game scored 0\u201310 by what\u2019s worth watching."),
    h("div", { key: "u", style: { display: "flex", fontSize: 22, fontWeight: 800, letterSpacing: "0.01em", color: accent } }, "courtvisual.com \u2192"),
  ]);

  return h("div", { style: { position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: 1200, height: 630, padding: "56px 66px", background: STAGE, color: CREAM, fontFamily: "Archivo" } }, [...bg, header, hero, footer]);
}

export default async function OpengraphImage({ params }) {
  const data = resolve(params.slug);
  return new ImageResponse(buildTree(data), { ...size, fonts: await fonts() });
}
