"use client";
import React, { useEffect, useMemo, useState, useRef, useId } from "react";
import { Search, Plus, X, Share2, ChevronDown, MapPin, Check, ArrowUpRight, Star, User, Calendar, Ticket, Flame, Mail, SlidersHorizontal, Trophy, Zap, Settings, Tv } from "lucide-react";
import { TEAMS, teamBySlug, FACTORS, PRESETS, DEFAULT_WEIGHTS, sampleSlate, scoreOf, scoreParts, verdict, shade, textOn, fanBump, fanScoreOf } from "../lib/data";
import { store, loadRemote, saveRemote } from "../lib/storage";
import { watchOptions } from "../lib/watch";
import { ticketUrl, tickpickCompareUrl, streamUrl, liveTvOffer } from "../lib/affiliates";
import { track } from "../lib/track";
import { supabase } from "../lib/supabaseClient";
import SiteHeader, { LogoPlate as SharedLogoPlate } from "./SiteHeader";

const PAGE = "#E7E3D8", INK = "#16130F";
const ON = "#ECE7DB", ON_MUTED = "rgba(236,231,219,0.60)", ON_FAINT = "rgba(236,231,219,0.40)", HAIR = "rgba(236,231,219,0.14)";
const CREAM = "#ECE7DB"; /* solid cream replaces the old foil gradient on CTAs and active chips */
const DEPTH = "0 1px 2px rgba(18,20,28,0.07), 0 6px 16px rgba(18,20,28,0.10), 0 22px 48px rgba(18,20,28,0.12)";
// Very-light jersey weave for the dialed-back card magic on the Settings surfaces (lighter + coarser than the game card's)
const FABRIC = "repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 5px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 5px)";
// The signature flame gradient — used by the score ring AND the factor bars so the
// scoring system reads consistently on every team's card, regardless of team color.
const FLAME_STOPS = ["#FFA52B", "#FF5A2C", "#B3122A"];
const FLAME = (deg) => `linear-gradient(${deg}deg, ${FLAME_STOPS[0]} 0%, ${FLAME_STOPS[1]} 55%, ${FLAME_STOPS[2]} 100%)`;
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`; };
const mulHex = (hex, k) => { const n = parseInt(hex.slice(1), 16); const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k); return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1); };
// Scale a team color down to a target luminance -> a clean, deep, readable team tone (no gray mud).
const deepen = (hex, target) => { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = (n & 255); const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; const k = lum > target ? target / lum : 1; r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * k); return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1); };
const SPORTS = [{ id: "nfl", label: "Football" }, { id: "nba", label: "Basketball" }, { id: "mlb", label: "Baseball" }, { id: "nhl", label: "Hockey" }, { id: "mls", label: "Soccer" }, { id: "wnba", label: "WNBA" }, { id: "boxing", label: "Boxing" }];
// Sports a user can follow in the bottom bar — each taps into a ranked league/sport feed.
// `q` is the Ticketmaster classification name the feed queries.
const FOLLOW_SPORTS = [
  { id: "nba", label: "NBA", q: "NBA" },
  { id: "wnba", label: "WNBA", q: "WNBA" },
  { id: "mlb", label: "MLB", q: "MLB" },
  { id: "nfl", label: "NFL", q: "NFL" },
  { id: "nhl", label: "NHL", q: "NHL" },
  { id: "mls", label: "MLS", q: "MLS" },
  { id: "soccer", label: "Soccer", q: "Soccer" },
  { id: "cfb", label: "College Football", q: "NCAA Football" },
  { id: "cbb", label: "College Basketball", q: "NCAA Basketball" },
  { id: "tennis", label: "Tennis", q: "Tennis" },
  { id: "boxing", label: "Boxing", q: "Boxing" },
  { id: "mma", label: "MMA", q: "MMA" },
  { id: "golf", label: "Golf", q: "Golf" },
  { id: "olympics", label: "Olympics", q: "Olympics" },
];

function useCountUp(target, dep) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(target); return; }
    let raf, start;
    const tick = (t) => {
      if (start === undefined) start = t;
      const p = Math.min((t - start) / 1000, 1);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setV(0); raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dep]);
  return v;
}

function Ring({ value }) {
  const R = 27, C = 2 * Math.PI * R, frac = Math.max(0, Math.min(1, value / 10));
  return (
    <svg width="66" height="66" viewBox="0 0 66 66">
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="66" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFA52B" /><stop offset="55%" stopColor="#FF5A2C" /><stop offset="100%" stopColor="#B3122A" />
        </linearGradient>
      </defs>
      <circle cx="33" cy="33" r={R} fill="none" strokeWidth="5" stroke="rgba(255,255,255,0.13)" />
      <circle cx="33" cy="33" r={R} fill="none" strokeWidth="5.5" stroke="url(#ringGrad)" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 33 33)" />
      <text x="33" y="33" textAnchor="middle" dominantBaseline="central" className="g-display" fontSize="17" fill="#FF7A2E">{value.toFixed(1)}</text>
    </svg>
  );
}

function Bars({ g, accent, weights, dark }) {
  const sum = (weights.playoff + weights.rivalry + weights.hot + weights.historic) || 1;
  const track = dark ? "rgba(255,255,255,0.10)" : "rgba(22,19,15,0.10)";
  const txt = dark ? "rgba(255,255,255,0.55)" : "rgba(22,19,15,0.55)";
  const lab = dark ? "rgba(255,255,255,0.85)" : "rgba(22,19,15,0.85)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {FACTORS.map((f) => {
        const pct = Math.round((weights[f.key] / sum) * 100);
        return (
          <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: lab, width: 92, flexShrink: 0 }}>{f.label}</span>
            <div style={{ flex: 1, height: 6, borderRadius: 4, background: track }}>
              <div style={{ width: `${g[f.key] * 10}%`, height: "100%", borderRadius: 4, background: FLAME(90) }} />
            </div>
            <span style={{ fontSize: 11, color: txt, width: 64, textAlign: "right", flexShrink: 0 }}>{g[f.key]} · {pct}%</span>
          </div>
        );
      })}
    </div>
  );
}


function GameModule({ rank, game, teamName, weights, style, primary, secondary, reaction, onReact, onShare, shared, laser, isTouch, rivalryNames, mode, league, fanCtx }) {
  const parts = scoreParts(game, weights);
  const fb = fanCtx ? fanBump(game, fanCtx) : { bump: 0, reasons: [] };
  const score = fb.bump > 0 ? Math.round(Math.min(10, parts.score + fb.bump) * 10) / 10 : parts.score;
  const anim = useCountUp(score, style);
  const [open, setOpen] = useState(rank === 1); // only the top-ranked game opens by default; rest collapsed for density
  const dark = style === "dashboard";
  const ink = dark ? "#FFFFFF" : INK;
  const muted = dark ? "rgba(255,255,255,0.6)" : "rgba(22,19,15,0.58)";
  const deepBase = deepen(primary, 0.13); // clean, deep team color for dark cards (replaces murky gray slate)
  const card = {
    borderRadius: 22, padding: 18, marginBottom: 14, position: "relative", overflow: "hidden",
    backgroundColor: dark ? deepBase : "#FCFBF8",
    // Dark: team atmosphere (top-lit radial deepening to the edges) + soft top glow + a fine white-alpha
    // jersey weave, all CSS so it themes per team. Light: bright off-white + the original mesh wash.
    backgroundImage: dark
      ? `repeating-linear-gradient(45deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 4px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 4px), radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,0.10), rgba(255,255,255,0) 55%), radial-gradient(135% 95% at 50% -12%, ${deepBase} 0%, ${deepBase} 42%, ${shade(deepBase, 0.40)} 100%)`
      : `linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.06)), url(/mesh.webp), linear-gradient(180deg, ${hexA(primary, 0.05)}, ${hexA(primary, 0.02)})`,
    backgroundSize: dark ? "auto" : "cover, 200px, cover",
    backgroundRepeat: dark ? "repeat" : "no-repeat, repeat, no-repeat",
    border: dark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(22,19,15,0.06)",
    boxShadow: dark
      ? `${DEPTH}, inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -46px 70px rgba(0,0,0,0.40)`
      : `${DEPTH}, inset 0 1px 0 rgba(255,255,255,0.9)`,
  };
  const body = (
    <div style={card}>
      <div className="g-display" aria-hidden="true" style={{ position: "absolute", top: -8, right: 4, fontSize: 80, color: dark ? "rgba(255,255,255,0.05)" : "rgba(22,19,15,0.05)", pointerEvents: "none" }}>{rank}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
        {dark ? <Ring value={anim} />
          : <div className="g-display" style={{ fontSize: 58, lineHeight: 0.8, backgroundImage: FLAME(135), WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "#FF5A2C" }}>{anim.toFixed(1)}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="g-display" style={{ fontSize: 21, color: ink }}>{game.matchup ? game.matchup.toUpperCase() : `VS ${(game.opp || "TBD").toUpperCase()}`}</span>
            {game.topRivals ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 999, background: hexA(secondary, 0.16), border: `1px solid ${hexA(secondary, 0.34)}`, color: dark ? "#fff" : INK, fontSize: 10, fontWeight: 700, letterSpacing: "0.02em" }}>
                <Flame size={10} /> {(rivalryNames !== false && game.rivalryName) || "Top Rivals"}
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 999, background: dark ? "rgba(255,255,255,0.10)" : hexA(primary, 0.10), color: dark ? "rgba(255,255,255,0.85)" : INK, fontSize: 10, fontWeight: 700 }}>
                <Flame size={10} /> {verdict(score)}
              </span>
            )}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: muted, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{game.tag}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 12, color: muted }}><Calendar size={12} /> {game.date} · {game.home ? "Home" : "Away"}</div>
        </div>
      </div>

      {mode === "watch" ? (() => {
        const w = watchOptions(league || game.sport, game);
        const chipS = { display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: dark ? "rgba(255,255,255,0.10)" : "rgba(22,19,15,0.07)", color: ink, border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(22,19,15,0.10)" };
        return (
          <div style={{ marginTop: 14 }}>
            {w.networks ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: 13, padding: "13px 16px", background: secondary, backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.032) 0 1px, transparent 1px 7px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.032) 0 1px, transparent 1px 7px), linear-gradient(180deg, ${secondary} 0%, ${shade(secondary, 0.12)} 100%)`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.34), 0 6px 15px rgba(0,0,0,0.30)", color: textOn(secondary), fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 14 }}>
                <Tv size={15} /> On {w.networks.join(" · ")}
              </div>
            ) : (
              <>
                <div className="g-eyebrow" style={{ fontSize: 9, color: muted, marginBottom: 8 }}>Where to watch</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {w.national.map((n) => (<span key={n} style={chipS}>{n}</span>))}
                </div>
              </>
            )}
            {w.streamer && (
              <button onClick={() => { track("stream_click", { key: w.streamer.key }); window.open(streamUrl(w.streamer.key, w.streamer.url), "_blank", "noopener"); }}
                style={{ width: "100%", marginTop: 9, padding: "11px 14px", borderRadius: 12, cursor: "pointer", background: dark ? "rgba(255,255,255,0.07)" : "rgba(22,19,15,0.05)", border: dark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(22,19,15,0.12)", color: ink, fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <Tv size={14} /> {w.streamer.label} <span style={{ fontWeight: 500, color: muted }}>· {w.streamer.note}</span> <ArrowUpRight size={12} />
              </button>
            )}
            {liveTvOffer() && (
              <button onClick={() => { track("livetv_click", {}); window.open(liveTvOffer().url, "_blank", "noopener"); }}
                style={{ width: "100%", marginTop: 7, padding: "9px 14px", borderRadius: 12, cursor: "pointer", background: "none", border: dark ? "1px dashed rgba(255,255,255,0.18)" : "1px dashed rgba(22,19,15,0.18)", color: muted, fontFamily: "'Archivo',sans-serif", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Don&rsquo;t have these channels? {liveTvOffer().label} <ArrowUpRight size={11} />
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 10.5, color: muted, lineHeight: 1.4 }}>{w.localNote}</span>
              {game.url && (
                <button onClick={() => onShare(game, "buy")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, color: ink, fontFamily: "'Archivo',sans-serif", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Ticket size={12} /> {game.minPrice ? `Tickets from $${game.minPrice}` : "Get tickets"} <ArrowUpRight size={11} />
                </button>
              )}
            </div>
          </div>
        );
      })() : (
      <>
      <button onClick={() => onShare(game, "buy")}
        style={{ width: "100%", marginTop: 14, padding: "13px 16px", borderRadius: 13, border: "none", cursor: "pointer",
          color: textOn(secondary), backgroundColor: secondary,
          backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.032) 0 1px, transparent 1px 7px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.032) 0 1px, transparent 1px 7px), linear-gradient(180deg, ${secondary} 0%, ${shade(secondary, 0.12)} 100%)`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.34), 0 6px 15px rgba(0,0,0,0.30)",
          fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: game.minPrice ? "space-between" : "center", gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Ticket size={15} /> Get tickets <ArrowUpRight size={13} /></span>
        {game.minPrice ? <span style={{ fontWeight: 800 }}>From ${game.minPrice}</span> : null}
      </button>
      {tickpickCompareUrl(game.matchup || `${teamName} vs ${game.opp}`) && (
        <button onClick={() => { track("tickpick_click", { opp: game.opp }); window.open(tickpickCompareUrl(game.matchup || `${teamName} vs ${game.opp}`), "_blank", "noopener"); }}
          style={{ width: "100%", marginTop: 7, padding: 0, background: "none", border: "none", cursor: "pointer", color: muted, fontFamily: "'Archivo',sans-serif", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          Compare prices on TickPick <ArrowUpRight size={11} />
        </button>
      )}
      </>
      )}

      <div style={{ marginTop: 14, paddingTop: 11, borderTop: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(22,19,15,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button onClick={() => onShare(game, "share")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: ink, fontFamily: "'Archivo',sans-serif", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {shared ? <><Check size={13} /> Copied</> : <><Share2 size={13} /> Share with friends</>}
        </button>
        <button onClick={() => setOpen(!open)} aria-expanded={open}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: ink, display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span className="g-eyebrow" style={{ fontSize: 9.5 }}>Why this game scores {score.toFixed(1)}</span>
          <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", color: muted }} />
        </button>
      </div>
      {open && <div style={{ paddingTop: 8, paddingBottom: 6 }}>
        <Bars g={game} accent={primary} weights={weights} dark={dark} />
        {game.matchupWhy ? (
          <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.4, color: dark ? "rgba(236,231,219,0.55)" : "rgba(22,19,15,0.55)" }}>
            <Zap size={11} style={{ verticalAlign: "-1px", marginRight: 5 }} />
            Matchup: {game.matchupWhy}.
          </div>
        ) : (
          <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.4, color: dark ? "rgba(236,231,219,0.4)" : "rgba(22,19,15,0.4)" }}>
            <Zap size={11} style={{ verticalAlign: "-1px", marginRight: 5 }} />
            Matchup read available closer to game day.
          </div>
        )}
        {fb.bump > 0 && (
          <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.4, color: dark ? "rgba(236,231,219,0.6)" : "rgba(22,19,15,0.6)" }}>
            <Flame size={11} style={{ verticalAlign: "-1px", marginRight: 5 }} color={primary} />
            Fan lens: {fb.reasons.join(" · ")}.
          </div>
        )}
        {parts.floored && (
          <div style={{ marginTop: 10, fontSize: 11, lineHeight: 1.4, color: dark ? "rgba(236,231,219,0.55)" : "rgba(22,19,15,0.55)" }}>
            <Trophy size={11} style={{ verticalAlign: "-1px", marginRight: 5 }} />
            {game.tag} floor {parts.floor.toFixed(1)} — games this big can&rsquo;t score low. Your weights rank everything above it.
          </div>
        )}
      </div>}

    </div>
  );
  return body;
}

const chip = (active) => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: `1px solid ${active ? "transparent" : "rgba(236,231,219,0.20)"}`, background: active ? CREAM : "transparent", color: active ? INK : ON, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Archivo',sans-serif" });

// "Hot games for you" — ranking boost from the fan's profile. Pure and additive:
// the displayed score stays the honest scoreOf; the boost only reorders the list.
const LEAGUE_GENRE = { nba: "basketball", wnba: "basketball", mlb: "baseball", nfl: "football", nhl: "hockey", mls: "soccer" };
export function interestBoost(g, favTeams, players) {
  const hay = `${g.matchup || ""} ${g.opp || ""}`;
  let boost = 0;
  if ((favTeams || []).some((t) => t?.name && new RegExp(`\\b${t.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(hay))) boost += 1.2;
  const favGenres = new Set((favTeams || []).map((t) => LEAGUE_GENRE[t?.league]).filter(Boolean));
  if (g.sport && favGenres.has(g.sport)) boost += 0.5;
  if ((players || []).some((p) => p && hay.toLowerCase().includes(p.toLowerCase()))) boost += 0.6;
  return boost;
}
const dots = (t) => (
  <span style={{ display: "inline-flex" }}>
    <span style={{ width: 11, height: 11, borderRadius: 999, background: t.primary, border: "1.5px solid #fff" }} />
    <span style={{ width: 11, height: 11, borderRadius: 999, background: t.secondary, border: "1.5px solid #fff", marginLeft: -5 }} />
  </span>
);
const tick = { display: "inline-block", width: 16, height: 4, background: "#E8401F", borderRadius: 1, marginRight: 9, verticalAlign: "middle" };

function StyleMini({ variant }) {
  const uid = useId().replace(/[:]/g, "");
  const gid = `mini-${uid}`;
  const dark = variant === "dashboard";
  const heat = "linear-gradient(135deg,#FFA52B,#FF5A2C 55%,#B3122A)";
  const C = 2 * Math.PI * 11;
  return (
    <div style={{ background: dark ? "#161B26" : "#F7F2E6", borderRadius: 10, padding: 9, height: 104, display: "flex", flexDirection: "column", gap: 7, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {dark ? (
          <svg width="30" height="30" viewBox="0 0 30 30">
            <defs><linearGradient id={gid} x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFA52B" /><stop offset="55%" stopColor="#FF5A2C" /><stop offset="100%" stopColor="#B3122A" />
            </linearGradient></defs>
            <circle cx="15" cy="15" r="11" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="3" />
            <circle cx="15" cy="15" r="11" fill="none" stroke={`url(#${gid})`} strokeWidth="3.2" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * 0.12} transform="rotate(-90 15 15)" />
            <text x="15" y="15" textAnchor="middle" dominantBaseline="central" className="g-display" fontSize="9" fill="#FF7A2E">9.2</text>
          </svg>
        ) : (
          <span className="g-display" style={{ fontSize: 26, lineHeight: 0.8, backgroundImage: heat, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "#FF5A2C" }}>9.2</span>
        )}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 6, width: "70%", borderRadius: 3, background: dark ? "#fff" : INK, opacity: 0.85 }} />
          <div style={{ height: 4, width: "45%", borderRadius: 3, background: dark ? "#fff" : INK, opacity: 0.4 }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[0.8, 0.55, 0.65].map((w, i) => (
          <div key={i} style={{ height: 4, borderRadius: 3, background: dark ? "rgba(255,255,255,0.12)" : "rgba(22,19,15,0.10)" }}>
            <div style={{ width: `${w * 100}%`, height: "100%", borderRadius: 3, background: heat }} />
          </div>
        ))}
      </div>
      <div style={{ height: 14, borderRadius: 6, background: "#1E73E8" }} />
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="g-ui" style={{ color: INK, width: "100%", minHeight: "100vh", position: "relative" }}>
      <div className="cv-stage" aria-hidden="true" />
      <div className="cv-grain" aria-hidden="true" />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 540, margin: "0 auto", padding: "26px 20px calc(48px + env(safe-area-inset-bottom))" }}>
        {children}
        <footer style={{ marginTop: 36, paddingTop: 16, borderTop: "1px solid rgba(236,231,219,0.08)", textAlign: "center" }}>
          <a href="https://www.shawncapizzi.com" target="_blank" rel="noopener" style={{ fontSize: 11, color: "rgba(236,231,219,0.38)", textDecoration: "none", fontFamily: "'Archivo',sans-serif" }}>
            Designed &amp; built by <span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>Shawn M. Capizzi</span> — shawncapizzi.com
          </a>
        </footer>
      </div>
    </div>
  );
}

function ContextCard({ title, body, primary, teamRecord }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(22,19,15,0.06)", boxShadow: DEPTH, borderRadius: 16, padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ ...tick, background: primary, marginRight: 0 }} />
        <span className="g-display" style={{ fontSize: 16, color: INK }}>{title}</span>
        {teamRecord && <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "rgba(22,19,15,0.55)" }}>{teamRecord.str}</span>}
      </div>
      <p style={{ fontSize: 13, color: "rgba(22,19,15,0.6)", marginTop: 8, lineHeight: 1.45 }}>{body}</p>
    </div>
  );
}

function Section({ label, children, primary }) {
  return (
    <div style={{ borderRadius: 16, padding: "16px 16px 18px", marginBottom: 12, background: "rgba(255,255,255,0.022)", backgroundImage: FABRIC, border: "1px solid rgba(236,231,219,0.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
      <div className="g-eyebrow" style={{ fontSize: 10, color: ON_MUTED, marginBottom: 14 }}><span style={{ ...tick, background: primary }} />{label}</div>
      {children}
    </div>
  );
}

export default function GameScoreApp() {
  const [view, setView] = useState("onboarding");
  const [settingsJump, setSettingsJump] = useState(null); // deep-link target inside Settings (e.g. "excitement")
  const [showTopper, setShowTopper] = useState(false); // first-run "ranked for your taste" banner (session-only, never persisted)
  const [topperGone, setTopperGone] = useState(false);
  const [obStep, setObStep] = useState(1); // onboarding: 1 = teams, 2 = your kind of exciting
  const [teamSlugs, setTeamSlugs] = useState([]);
  const [primarySlug, setPrimarySlug] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerInput, setPlayerInput] = useState("");
  const [location, setLocation] = useState("");
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [preset, setPreset] = useState("balanced");
  const [cardStyle, setCardStyle] = useState("dashboard");
  const [rivalryNames, setRivalryNames] = useState(true); // show "El Tráfico" / "Subway Series" on pills (Settings)
  const [viewMode, setViewMode] = useState("watch"); // "watch" | "tickets" — the card's action layer (watch is the everyday default)
  const [followedSports, setFollowedSports] = useState(null); // null = auto from team leagues
  const [intensities, setIntensities] = useState({}); // { slug: "follow" | "diehard" } — fan-lens per-team
  const [lens, setLens] = useState("neutral"); // "neutral" | "fan" — global, flippable, disclosed
  const [override, setOverride] = useState(null);
  const [q, setQ] = useState("");
  const [reactions, setReactions] = useState({});
  const [shared, setShared] = useState(null);
  const [shareGame, setShareGame] = useState(null); // game pending an intent-picker choice
  const [shareIntent, setShareIntent] = useState(null); // chosen intent → reveals channel row
  const [session, setSession] = useState(null);
  const [isTouch, setIsTouch] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  const snapshot = { teams: teamSlugs, primary: primarySlug, players, location, weights, preset, cardStyle, override, reactions, rivalryNames, viewMode, followedSports, intensities, lens };
  const snapRef = useRef(snapshot);
  snapRef.current = snapshot;
  const applyState = (st) => {
    if (st.teams) setTeamSlugs(st.teams);
    if (st.primary !== undefined) setPrimarySlug(st.primary);
    if (st.players) setPlayers(st.players);
    if (st.location !== undefined) setLocation(st.location);
    if (st.weights) setWeights(st.weights);
    if (st.preset !== undefined) setPreset(st.preset);
    if (st.cardStyle) setCardStyle(st.cardStyle);
    if (st.reactions) setReactions(st.reactions);
    if (st.rivalryNames !== undefined) setRivalryNames(st.rivalryNames);
    if (st.viewMode) setViewMode(st.viewMode);
    if (st.followedSports !== undefined) setFollowedSports(st.followedSports);
    if (st.intensities) setIntensities(st.intensities);
    if (st.lens) setLens(st.lens);
  };

  // hydrate from on-device storage (swap for Supabase later)
  useEffect(() => {
    const s = store.load();
    if (s.teams?.length) {
      setTeamSlugs(s.teams);
      setPrimarySlug(s.primary || s.teams[0]);
      setView("games");
    }
    if (s.players) setPlayers(s.players);
    if (s.location) setLocation(s.location);
    if (s.weights) setWeights(s.weights);
    if (s.preset !== undefined) setPreset(s.preset);
    if (s.cardStyle) setCardStyle(s.cardStyle);
    if (s.reactions) setReactions(s.reactions);
    if (s.rivalryNames !== undefined) setRivalryNames(s.rivalryNames);
    if (s.viewMode) setViewMode(s.viewMode);
    if (s.followedSports !== undefined) setFollowedSports(s.followedSports);
    if (s.intensities) setIntensities(s.intensities);
    if (s.lens) setLens(s.lens);
    if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
    if (typeof caches !== "undefined") caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {});
  }, []);

  useEffect(() => { try { setIsTouch(window.matchMedia("(hover: none)").matches); } catch {} }, []);

  // Self-heal stale bundles: after a deploy, a cached shell can reference JS
  // chunks that no longer exist -> "client-side exception". Reload once.
  useEffect(() => {
    const K = "cv-chunk-reloaded";
    const onErr = (e) => {
      const msg = `${e?.reason?.message || e?.message || e?.reason || ""}`;
      if (/ChunkLoadError|Loading chunk|importing a module script failed|dynamically imported module|Failed to fetch dynamically/i.test(msg)) {
        try { if (!sessionStorage.getItem(K)) { sessionStorage.setItem(K, "1"); window.location.reload(); } } catch {}
      }
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onErr);
    const t = setTimeout(() => { try { sessionStorage.removeItem(K); } catch {} }, 5000);
    return () => { window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onErr); clearTimeout(t); };
  }, []);

  // Land at the top of every screen when switching views (don't inherit scroll).
  useEffect(() => { try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch { window.scrollTo(0, 0); } if (view === "onboarding") setObStep(1); }, [view]);
  useEffect(() => {
    if (!showTopper) return;
    const a = setTimeout(() => setTopperGone(true), 5200);
    const b = setTimeout(() => { setShowTopper(false); setTopperGone(false); }, 5900);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [showTopper]);
  useEffect(() => {
    if (view === "settings" && settingsJump) {
      const id = `settings-${settingsJump}`;
      requestAnimationFrame(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); setSettingsJump(null); });
    }
  }, [view, settingsJump]);

  // track auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => data.subscription?.unsubscribe();
  }, []);

  // on sign-in: pull cloud state, or push the on-device state up if cloud is empty
  useEffect(() => {
    if (!session?.user) return;
    let cancel = false;
    (async () => {
      const remote = await loadRemote(session.user.id);
      if (cancel) return;
      if (remote && Object.keys(remote).length) {
        applyState(remote);
        if (remote.teams?.length) setView((v) => (v === "onboarding" ? "games" : v));
      } else {
        await saveRemote(session.user.id, snapRef.current);
      }
    })();
    return () => { cancel = true; };
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // persist on change: on-device always; cloud (debounced) when signed in
  useEffect(() => {
    store.save(snapshot);
    if (session?.user) { const t = setTimeout(() => saveRemote(session.user.id, snapshot), 600); return () => clearTimeout(t); }
  }, [teamSlugs, primarySlug, players, location, weights, preset, cardStyle, override, reactions, session]); // eslint-disable-line react-hooks/exhaustive-deps

  const favTeams = teamSlugs.map(teamBySlug).filter(Boolean);
  const team = teamBySlug(primarySlug) || favTeams[0] || TEAMS[0];
  const primary = override || team.primary;
  const secondary = team.secondary;

  // Live schedule via /api/games (Ticketmaster). Falls back to the sample slate
  // when no API key is configured or the team has no upcoming listed events.
  const [liveGames, setLiveGames] = useState(null);
  const [leagueGames, setLeagueGames] = useState(null);
  const [slateMode, setSlateMode] = useState("team");
  const [teamRecord, setTeamRecord] = useState(null);
  const [jump, setJump] = useState("");
  const [eventResults, setEventResults] = useState(null);
  const [eventQuery, setEventQuery] = useState("");
  const [eventLoading, setEventLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sportFocus, setSportFocus] = useState(null);
  const [visible, setVisible] = useState(8);
  const [sortMode, setSortMode] = useState("score"); // "score" (excitement, default) | "date" (chronological, for planning)
  const [hotSlugs, setHotSlugs] = useState([]);
  const DEFAULT_POPULAR = ["giants", "mets", "cowboys", "new-york-red-bulls", "la-galaxy", "chiefs", "knicks", "bulls"];
  useEffect(() => { setVisible(8); }, [primarySlug, eventQuery]); // reset reveal count on team/search change
  useEffect(() => { fetch("/api/popular").then((r) => r.json()).then((d) => { if (Array.isArray(d.hot)) setHotSlugs(d.hot); }).catch(() => {}); }, []);
  useEffect(() => {
    if (!team) return;
    let cancel = false;
    fetch(`/api/games?label=${encodeURIComponent(team.label)}&name=${encodeURIComponent(team.name)}&city=${encodeURIComponent(team.city)}&slug=${team.slug}&league=${team.league || ""}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (cancel) return;
        setLiveGames(d.games?.length ? d.games : null);
        setLeagueGames(d.leagueGames?.length ? d.leagueGames : null);
        setSlateMode(d.mode || "team");
        setTeamRecord(d.teamRecord || null);
      })
      .catch(() => { if (!cancel) { setLiveGames(null); setLeagueGames(null); setSlateMode("offseason"); } });
    return () => { cancel = true; };
  }, [team?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    if (!q.trim()) {
      const base = DEFAULT_POPULAR.map((sl) => teamBySlug(sl)).filter(Boolean);
      if (hotSlugs.length) {
        const order = new Map(hotSlugs.map((sl, i) => [sl, i]));
        return [...base].sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));
      }
      return base;
    }
    const s = q.toLowerCase();
    return TEAMS.filter((t) => t.label.toLowerCase().includes(s)).slice(0, 8);
  }, [q, hotSlugs]); // eslint-disable-line react-hooks/exhaustive-deps

  const addTeam = (t) => { if (!teamSlugs.includes(t.slug)) { setTeamSlugs([...teamSlugs, t.slug]); if (!primarySlug) setPrimarySlug(t.slug); } setQ(""); };
  const removeTeam = (t) => { const next = teamSlugs.filter((s) => s !== t.slug); setTeamSlugs(next); if (primarySlug === t.slug) setPrimarySlug(next[0] || null); };
  const applyPreset = (p) => { setPreset(p.id); setWeights(p.w); };
  const PRESET_DESC = {
    balanced: "A little of everything — the all-around great game.",
    stakes: "Championships, knockout rounds, playoff races. Something on the line.",
    rivalry: "Subway Series, El Tr\u00e1fico, Yankees\u2013Sox. History between the teams.",
    stars: "Marquee players and the hottest teams right now.",
    matchup: "Two strong teams, projected close \u2014 the games that go down to the wire.",
  };
  const onReact = (slug, id) => setReactions((r) => ({ ...r, [slug]: id }));
  const sendLink = async () => {
    if (!authEmail.trim()) return;
    setAuthMsg("Sending\u2026");
    const { error } = await supabase.auth.signInWithOtp({ email: authEmail.trim(), options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined } });
    setAuthMsg(error ? error.message : "Check your email for a sign-in link.");
  };
  const signOut = async () => { await supabase.auth.signOut(); setAuthMsg(""); };
  const onShare = (g, kind) => {
    if (kind === "buy" || kind === "gift") {
      track("ticket_click", { opp: g.opp, ds: g.ds, kind, hasUrl: !!g.url });
      window.open(ticketUrl(g.url || `https://www.ticketmaster.com/search?q=${encodeURIComponent(team.name + " vs " + g.opp)}`), "_blank", "noopener,noreferrer");
      return;
    }
    setShareGame(g); // open the intent picker
  };
  // Fire the native share (or clipboard) with a chosen, score-accurate caption.
  // Build the score-accurate caption + url for a game/intent (pure — no side effects).
  const sharePayload = (g, intent) => {
    const score = +scoreOf(g, weights).toFixed(1);
    const v = verdict(score);
    const matchup = g.matchup || `${team.name} vs ${g.opp}`;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://courtvisual.com";
    const url = `${origin}/g/${team.slug}-vs-${g.oppSlug}-${g.ds}-s${score}?s=${score}${g.rivalryName ? `&r=${encodeURIComponent(g.rivalryName)}` : ""}`;
    const hot = score >= 8.5;
    let text;
    if (intent === "watch") text = `${matchup} — scored ${score} on CourtVisual${hot ? ` (${v})` : ""}. Let's watch this one.`;
    else if (intent === "go") text = `${matchup} — a ${score} on CourtVisual${hot ? `, ${v}` : ""}. Let's grab seats. You in?`;
    else text = hot ? `Gotta-see game: ${matchup}, a ${score} on CourtVisual (${v}). Don't miss this one.` : `${matchup} — scored ${score} on CourtVisual. Here's the rundown.`;
    return { score, matchup, url, text };
  };
  // Channel senders. Each picks the right transport; all close the sheet + flash the confirm.
  const sendVia = (g, intent, channel) => {
    const { score, matchup, url, text } = sharePayload(g, intent);
    const full = `${text} ${url}`;
    if (channel === "sms") {
      // sms: syntax is platform-split: iOS wants sms:&body=, Android wants sms:?body=.
      // Use a real navigation (location.href), not window.open — popups don't trigger Messages.
      const isAppleDevice = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
      const sep = isAppleDevice ? "&" : "?";
      try { window.location.href = `sms:${sep}body=${encodeURIComponent(full)}`; } catch { try { navigator.clipboard?.writeText(full); } catch {} }
    } else if (channel === "copy") {
      try { navigator.clipboard?.writeText(full); } catch {}
      setShared(g.oppSlug + "-copied"); setTimeout(() => setShared(null), 1600);
    } else { // "native" — the OS share sheet (WhatsApp, Messenger, email, Instagram on mobile, etc.)
      try { if (navigator.share) { navigator.share({ title: matchup, text, url }).catch(() => {}); } else { navigator.clipboard?.writeText(full); } } catch { try { navigator.clipboard?.writeText(full); } catch {} }
    }
    track("share_game", { opp: g.opp, ds: g.ds, score, intent, channel });
    if (channel !== "copy") { setShared(g.oppSlug); setTimeout(() => setShared(null), 1600); }
    setShareGame(null); setShareIntent(null);
  };


  // ---------- ranked list renderer (progressive "Show more" + rivalry focus) ----------
  const STEP = 8;
  // When rivalry is ~the only thing the fan weights (>=90% share), show ONLY
  // rivalry matchups instead of padding the list with non-rivalry games.
  const RIVALRY_FOCUS = 0.9;
  const wTotal = (weights.playoff + weights.rivalry + weights.hot + weights.historic) || 1;
  const rivalryOnly = weights.rivalry / wTotal >= RIVALRY_FOCUS;

  // Fan-lens context for a game in the current team view. The viewing team is, by
  // definition, one the user follows — so intensity comes from their setting (default follow).
  const fanCtxFor = (g) => (lens !== "fan" ? null : { intensity: intensities[team.slug] || "follow", isRival: !!g.topRivals, contention: g.teamContention });
  // Score under the active lens: neutral baseline, or fan-adjusted when the lens is on.
  const activeScore = (g) => (lens === "fan" ? fanScoreOf(g, weights, fanCtxFor(g)) : scoreOf(g, weights));

  const renderGames = (list, leagueHint = null, neutral = false, revealAll = false) => {
    let full = list;
    let note = null;
    if (rivalryOnly && !neutral) {
      const rivals = list.filter((g) => g.topRivals || g.rivalry > 4);
      if (rivals.length) { full = rivals; note = "Rivalry focus — showing rivalry matchups only."; }
      else { note = "No rivalry games on this schedule right now — showing the full ranking."; }
    }
    const shown = revealAll ? full : full.slice(0, visible);
    const remaining = revealAll ? 0 : full.length - shown.length;
    return (
      <>
        {note && (
          <div style={{ fontSize: 11.5, fontWeight: 600, color: ON_MUTED, marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Flame size={12} color="#FF5A2C" /> {note}
          </div>
        )}
        {shown.map((g, i) => (
          <GameModule key={(g.matchup || g.oppSlug) + i} rank={i + 1} game={g} teamName={neutral ? null : team.name} weights={weights} style={cardStyle} rivalryNames={rivalryNames} mode={viewMode} league={leagueHint} fanCtx={neutral ? null : fanCtxFor(g)}
            primary={primary} secondary={secondary} onShare={onShare} shared={shared === g.oppSlug} laser={i === 0} isTouch={isTouch} />
        ))}
        {remaining > 0 && (
          <>
            <button onClick={() => setVisible((v) => v + STEP)} style={{ width: "100%", marginTop: 4, padding: "13px", borderRadius: 12, cursor: "pointer", background: "rgba(236,231,219,0.07)", border: "1px solid rgba(236,231,219,0.14)", color: ON, fontFamily: "'Archivo',sans-serif", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              Show {Math.min(STEP, remaining)} more {remaining === 1 ? "game" : "games"} <ChevronDown size={15} />
            </button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11.5, color: ON_FAINT }}>Showing {shown.length} of {full.length}</span>
              {remaining > STEP && (
                <button onClick={() => setVisible(full.length)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: ON_MUTED, fontFamily: "'Archivo',sans-serif", fontSize: 11.5, fontWeight: 700 }}>
                  Show all {full.length}
                </button>
              )}
            </div>
          </>
        )}
      </>
    );
  };

  // ---------- search (jump to team / search any sport, place, or event) ----------
  const teamMatches = jump.trim() ? TEAMS.filter((t) => t.label.toLowerCase().includes(jump.trim().toLowerCase())).slice(0, 5) : [];
  const jumpToTeam = (t) => { if (!teamSlugs.includes(t.slug)) setTeamSlugs([...teamSlugs, t.slug]); setPrimarySlug(t.slug); setJump(""); setEventResults(null); setEventQuery(""); };
  // Switch to the results view immediately with a loading state, so taps feel responsive
  // (esp. weekend, where the geolocation prompt can take a few seconds).
  const beginSearch = (label) => { setEventLoading(true); setEventResults([]); setEventQuery(label); setJump(""); setFilterOpen(false); setView("games"); };
  const runEventSearch = async (query) => {
    const qq = (query || "").trim(); if (!qq) return;
    beginSearch(qq);
    try { const r = await fetch(`/api/games?q=${encodeURIComponent(qq)}`); const d = await r.json(); setEventResults(d.games || []); }
    catch { setEventResults([]); }
    setEventLoading(false);
  };
  const clearSearch = () => { setEventResults(null); setEventQuery(""); setJump(""); };
  const runSportFeed = async (sp) => {
    track("sport_feed", { id: sp.id });
    beginSearch(sp.label);
    try { const r = await fetch(`/api/games?sportfeed=${encodeURIComponent(sp.q)}`); const d = await r.json(); setEventResults(d.games || []); }
    catch { setEventResults([]); }
    setEventLoading(false);
  };
  // Bar sports: explicit follows once the user edits in Settings; otherwise auto from team leagues.
  const barSports = followedSports !== null
    ? FOLLOW_SPORTS.filter((sp) => followedSports.includes(sp.id))
    : FOLLOW_SPORTS.filter((sp) => favTeams.some((t) => t.league === sp.id));
  const fetchWeekend = async (lat, lng) => {
    try {
      const u = (lat != null && lng != null) ? `/api/games?weekend=1&lat=${lat}&lng=${lng}` : "/api/games?weekend=1";
      const r = await fetch(u); const d = await r.json(); setEventResults(d.games || []);
    } catch { setEventResults([]); }
    setEventLoading(false);
  };
  const weekendNearMe = () => {
    beginSearch("Games this weekend near you");
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeekend(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeekend(null, null),
        { timeout: 8000, maximumAge: 600000 }
      );
    } else { fetchWeekend(null, null); }
  };
  const FILTERS = [
    { id: "foryou", label: "Hot games for you", icon: Star, color: "#E1641F" },
    { id: "weekend", label: "Games this weekend near you", icon: MapPin, color: "#FF5A2C" },
    { id: "hot", label: "Hottest games of the season", icon: Flame, color: "#B3122A" },
    { id: "rivalry", label: "Rivalry showdowns", icon: Zap, color: "#E8401F" },
    { id: "stakes", label: "Championship & playoff games", icon: Trophy, color: "#0F4A18" },
  ];
  const runFilter = async (kind) => {
    track("filter", { kind });
    if (kind === "weekend") { weekendNearMe(); return; }
    const label = (FILTERS.find((f) => f.id === kind) || {}).label || "Hot games";
    beginSearch(label);
    try {
      const r = await fetch("/api/games?hot=1"); const d = await r.json();
      let g = d.games || [];
      // The national relevance feed can be flooded by one mega-event (e.g. a World Cup
      // summer), crowding the fan's own big games out of the candidate pool entirely.
      // Merge their followed teams' games in so a Finals run always competes.
      const seen = new Set(g.map((x) => `${x.oppSlug}-${x.ds}`));
      for (const x of (liveGames || [])) {
        const k = `${x.oppSlug}-${x.ds}`;
        if (!seen.has(k)) { seen.add(k); g.push(x); }
      }
      if (kind === "rivalry") g = g.filter((x) => x.topRivals || x.rivalry >= 7);
      if (kind === "stakes") g = g.filter((x) => x.playoff >= 7 || ["Championship", "Knockout stage", "Playoffs"].includes(x.tag));
      if (kind === "foryou") g = g.map((x) => ({ ...x, _boost: interestBoost(x, favTeams, players) }));
      setEventResults(g);
    } catch { setEventResults([]); }
    setEventLoading(false);
  };

  const screenH = { fontSize: 40, margin: "10px 0 6px", color: ON };
  const field = { display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.075)", backgroundImage: FABRIC, border: "1px solid rgba(236,231,219,0.18)", borderRadius: 12, padding: "12px 14px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)" };

  // ---------- ONBOARDING ----------
  if (view === "onboarding") {
    return (
      <Shell>
        <SiteHeader view={view} setView={setView} />
        {obStep === 1 ? (<>
        <div className="g-eyebrow" style={{ fontSize: 10, color: ON_MUTED }}><span style={tick} />Welcome</div>
        <h1 className="g-display" style={{ ...screenH, fontSize: 42 }}>EVERY GAME,<br />SCORED FOR YOU</h1>
        <p style={{ fontSize: 15, fontWeight: 700, color: ON, marginTop: 14, lineHeight: 1.4 }}>
          No boring feeds. Just the games you&rsquo;d love — recommended like a fellow fan who gets it.
        </p>
        <p style={{ fontSize: 13.5, color: ON_MUTED, marginTop: 8, lineHeight: 1.45 }}>
          Pick your team — or a sport like golf, the World Cup, or UFC. We score every upcoming game 0&ndash;10 and surface the ones worth your time — to watch, or to be there.
        </p>
        <p style={{ fontSize: 13, color: ON_MUTED, marginTop: 16 }}>Start with a team or sport — if it&rsquo;s a team, the app suits up in its colors.</p>
        <div style={{ ...field, marginTop: 20 }}>
          <Search size={18} color="rgba(236,231,219,0.5)" />
          <input className="g-in-dark" placeholder="Search a team, sport, place, or event…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {favTeams.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {favTeams.map((t) => (<span key={t.slug} style={chip(true)} onClick={() => removeTeam(t)}>{dots(t)} {t.name} <X size={13} /></span>))}
          </div>
        )}
        <div className="g-eyebrow" style={{ fontSize: 9, color: ON_MUTED, margin: "22px 0 10px" }}>{q.trim() ? "Results" : favTeams.length ? "Add another team" : "Popular"}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {results.map((t) => (
            <button key={t.slug} style={chip(false)} onClick={() => addTeam(t)}>{teamSlugs.includes(t.slug) ? <Check size={13} /> : dots(t)} {t.label}</button>
          ))}
        </div>
        {q.trim() && (
          <button onClick={() => { runEventSearch(q); setView("games"); }} style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, cursor: "pointer", color: ON, fontFamily: "'Archivo',sans-serif", fontSize: 13.5, fontWeight: 600, textAlign: "left" }}>
            <Search size={15} color={ON_MUTED} /> <span>Search all events for &ldquo;{q.trim()}&rdquo; — countries, leagues, tennis &amp; more →</span>
          </button>
        )}
        {!q.trim() && (() => {
          const cur = followedSports || [];
          const marquee = ["mma", "boxing", "golf", "tennis", "mls"];
          const picks = FOLLOW_SPORTS.filter((sp) => marquee.includes(sp.id));
          return (
            <>
              <div className="g-eyebrow" style={{ fontSize: 9, color: ON_MUTED, margin: "22px 0 6px" }}>Or follow a sport</div>
              <div style={{ fontSize: 11.5, color: ON_FAINT, marginBottom: 10, lineHeight: 1.4 }}>No team? Follow a whole sport or event — we rank what&rsquo;s worth watching across it.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {picks.map((sp) => {
                  const on = cur.includes(sp.id);
                  return (
                    <button key={sp.id} style={chip(on)} onClick={() => { const next = on ? cur.filter((i) => i !== sp.id) : [...cur, sp.id]; setFollowedSports(next); track("follow_sport", { id: sp.id, on: !on, where: "onboarding" }); }}>
                      {on ? <Check size={13} /> : null} {sp.label}
                    </button>
                  );
                })}
              </div>
            </>
          );
        })()}
        {favTeams.length > 0 && (
          <div style={{ fontSize: 11.5, color: ON_MUTED, lineHeight: 1.45, marginTop: 20, border: "1px solid rgba(236,231,219,0.12)", borderRadius: 12, padding: "10px 12px" }}>
            <i style={{ display: "none" }} />Every game&rsquo;s scored for a neutral fan, so the ranking&rsquo;s fair whether you&rsquo;re rooting or just watching. You can fine-tune what counts anytime in Settings.
          </div>
        )}
        {(() => {
          const hasSport = followedSports && followedSports.length > 0;
          const canContinue = teamSlugs.length > 0 || hasSport;
          // A sport-first user has no taste step value yet, but presets still apply — send them through too.
          return (
            <button disabled={!canContinue} onClick={() => setObStep(2)}
              style={{ marginTop: 24, width: "100%", padding: "15px", borderRadius: 12, border: "none", background: canContinue ? CREAM : "rgba(255,255,255,0.08)", color: canContinue ? INK : ON_FAINT, fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 14.5, cursor: canContinue ? "pointer" : "default", boxShadow: canContinue ? DEPTH : "none" }}>
              {canContinue ? "Next: your kind of exciting \u2192" : "Add a team or sport to continue"}
            </button>
          );
        })()}
        </>) : (<>
        <div className="g-eyebrow" style={{ fontSize: 10, color: ON_MUTED }}><span style={tick} />Step 2 of 2 · Your taste</div>
        <h1 className="g-display" style={screenH}>WHAT MAKES A GAME WORTH IT, TO YOU?</h1>
        <p style={{ fontSize: 15, fontWeight: 700, color: ON, marginTop: 14, lineHeight: 1.4 }}>
          This is the part no other app asks.
        </p>
        <p style={{ fontSize: 13.5, color: ON_MUTED, marginTop: 8, lineHeight: 1.45 }}>
          Pick a starting point — every game gets scored and re-ranked around it. Fine-tune the exact mix anytime with the <SlidersHorizontal size={12} style={{ verticalAlign: "-2px" }} /> sliders.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "16px 0 12px" }}>
          {FACTORS.map((f, fi) => (
            <span key={f.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: ON_MUTED }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: ["#B3122A", "#E8401F", "#FF7A2E", "#ECE7DB"][fi] }} /> {f.label}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PRESETS.map((p) => {
            const on = preset === p.id;
            return (
              <button key={p.id} onClick={() => { applyPreset(p); track("onboarding_preset", { id: p.id }); }}
                style={{ textAlign: "left", padding: "14px 16px", borderRadius: 14, cursor: "pointer", background: "rgba(255,255,255,0.05)", backgroundImage: FABRIC, border: `2px solid ${on ? CREAM : "rgba(236,231,219,0.14)"}`, boxShadow: on ? "0 4px 14px rgba(0,0,0,0.35)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 14, color: on ? ON : "rgba(236,231,219,0.85)" }}>
                  {on && <Check size={14} />} {p.label}
                </div>
                <div style={{ fontSize: 12, color: ON_MUTED, marginTop: 4, lineHeight: 1.4 }}>{PRESET_DESC[p.id]}</div>
                <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginTop: 10, opacity: on ? 1 : 0.55 }}>
                  {FACTORS.map((f, fi) => (
                    <span key={f.key} style={{ flex: p.w[f.key], background: ["#B3122A", "#E8401F", "#FF7A2E", "#ECE7DB"][fi] }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={() => {
          track("onboarding_complete", { preset, teams: teamSlugs.length, sports: (followedSports || []).length });
          setShowTopper(true);
          // Sport-only user (no team picked): open their first followed sport's feed so they
          // don't land on a fallback team's schedule.
          if (!teamSlugs.length && followedSports && followedSports.length) {
            const sp = FOLLOW_SPORTS.find((s) => s.id === followedSports[0]);
            if (sp) { setView("games"); runSportFeed(sp); return; }
          }
          setView("games");
        }}
          style={{ marginTop: 24, width: "100%", padding: "15px", borderRadius: 12, border: "none", background: CREAM, color: INK, fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 14.5, cursor: "pointer", boxShadow: DEPTH }}>
          Show my games
        </button>
        <button onClick={() => setObStep(1)} style={{ marginTop: 12, width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", color: ON_MUTED, fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 600 }}>
          ← Back to teams
        </button>
        </>)}
      </Shell>
    );
  }

  // ---------- SETTINGS ----------
  if (view === "settings") {
    return (
      <Shell>
        <SiteHeader view={view} setView={setView} />
        <h1 className="g-display" style={screenH}>SETTINGS</h1>
        <p style={{ fontSize: 12.5, color: ON_MUTED, margin: "2px 0 16px" }}>Your teams, your excitement, and how the app looks and behaves.</p>
        <Section primary={primary} label="Your teams">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {favTeams.map((t) => (<span key={t.slug} style={chip(primarySlug === t.slug)} onClick={() => setPrimarySlug(t.slug)}>{dots(t)} {t.name} <X size={12} onClick={(e) => { e.stopPropagation(); removeTeam(t); }} /></span>))}
          <button style={chip(false)} onClick={() => setView("onboarding")}><Plus size={13} /> Add</button>
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(236,231,219,0.08)" }}>
          <div style={{ fontSize: 12, color: ON_MUTED, marginBottom: 10, lineHeight: 1.4 }}>How hard do you go for each team? Die-hards see their games &mdash; and their rivals &mdash; run hotter.</div>
          {favTeams.map((t) => {
            const di = (intensities[t.slug] || "follow") === "diehard";
            return (
              <div key={t.slug} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: ON, display: "inline-flex", alignItems: "center", gap: 6 }}>{dots(t)} {t.name}</span>
                <div style={{ display: "inline-flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 9, padding: 3 }}>
                  {[["follow", "Follow"], ["diehard", "Die-hard"]].map(([k, l]) => {
                    const on = (k === "diehard") === di;
                    return (<button key={k} onClick={() => { const next = { ...intensities, [t.slug]: k }; setIntensities(next); if (k === "diehard" && lens === "neutral") setLens("fan"); track("fan_intensity", { team: t.slug, intensity: k }); }}
                      style={{ padding: "5px 11px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "'Archivo',sans-serif", fontSize: 11.5, fontWeight: 700, background: on ? CREAM : "transparent", color: on ? INK : ON_MUTED }}>{l}</button>);
                  })}
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(236,231,219,0.08)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: ON }}>Scored as</span>
            <div style={{ display: "inline-flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 9, padding: 3 }}>
              {[["neutral", "Neutral"], ["fan", "Fan view"]].map(([k, l]) => {
                const on = lens === k;
                return (<button key={k} onClick={() => { setLens(k); track("lens_flip", { lens: k }); }}
                  style={{ padding: "5px 11px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "'Archivo',sans-serif", fontSize: 11.5, fontWeight: 700, background: on ? CREAM : "transparent", color: on ? INK : ON_MUTED }}>{l}</button>);
              })}
            </div>
          </div>
          <div style={{ fontSize: 11, color: ON_FAINT, marginTop: 8, lineHeight: 1.4 }}>Fan view lifts your teams&rsquo; games with disclosed bumps, shown on every card. Neutral is the honest baseline &mdash; flip back anytime.</div>
        </div>
      </Section>
        <div id="settings-excitement"><Section primary={primary} label="Your excitement">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {PRESETS.map((p) => (<button key={p.id} style={chip(preset === p.id)} onClick={() => applyPreset(p)}>{p.label}</button>))}
        </div>
        <div style={{ background: "rgba(255,255,255,0.035)", backgroundImage: FABRIC, border: "1px solid rgba(236,231,219,0.10)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.28)", borderRadius: 16, padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 32px" }}>
          {FACTORS.map((f) => (
            <div key={f.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: ON }}>{f.label}</span>
                <span className="g-display" style={{ fontSize: 17, backgroundImage: "linear-gradient(180deg,#8FE89E 0%,#39B24C 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "#6FD680" }}>{weights[f.key]}</span>
              </div>
              <input className="g-slider" type="range" min="0" max="100" value={weights[f.key]} onChange={(e) => { setWeights({ ...weights, [f.key]: +e.target.value }); setPreset(null); }} />
            </div>
          ))}
        </div>
      </Section></div>

        <Section primary={primary} label="Players you follow">
        <div style={field}>
          <User size={16} color="rgba(236,231,219,0.5)" />
          <input className="g-in-dark" placeholder="Add a player…" value={playerInput} onChange={(e) => setPlayerInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && playerInput.trim()) { setPlayers([...players, playerInput.trim()]); setPlayerInput(""); } }} />
        </div>
        {players.length > 0 && (<div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>{players.map((p, i) => (<span key={i} style={chip(true)} onClick={() => setPlayers(players.filter((_, j) => j !== i))}>{p} <X size={12} /></span>))}</div>)}
      </Section>
        <Section primary={primary} label="Display">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: ON }}>Rivalry names on cards</div>
              <div style={{ fontSize: 12, color: ON_MUTED, marginTop: 3, lineHeight: 1.4 }}>Show the real name — &ldquo;El Tr&aacute;fico&rdquo;, &ldquo;Subway Series&rdquo;, &ldquo;Hell Is Real&rdquo; — instead of &ldquo;Top Rivals&rdquo;.</div>
            </div>
            <button onClick={() => setRivalryNames(!rivalryNames)} style={chip(rivalryNames)}>{rivalryNames ? <Check size={13} /> : <X size={13} />} {rivalryNames ? "On" : "Off"}</button>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: ON, marginBottom: 3 }}>Card actions</div>
            <div style={{ fontSize: 12, color: ON_MUTED, marginBottom: 8, lineHeight: 1.4 }}>Every game flips between <b style={{ color: ON }}>where to watch</b> (TV &amp; streaming) and <b style={{ color: ON }}>tickets</b> to be there live — the <Ticket size={11} style={{ verticalAlign: "-1px" }} /> / <Tv size={11} style={{ verticalAlign: "-1px" }} /> toggle next to your team name.</div>
            <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "rgba(255,255,255,0.07)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              {[["watch", Tv, "Watch"], ["tickets", Ticket, "Tickets"]].map(([k, Icon, l]) => {
                const on = viewMode === k;
                return (<button key={k} onClick={() => { track("view_mode", { mode: k, from: "settings" }); setViewMode(k); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer", fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 600, padding: "7px 14px", borderRadius: 9, background: on ? CREAM : "transparent", color: on ? INK : ON_MUTED, boxShadow: on ? "0 1px 3px rgba(0,0,0,0.35)" : "none" }}><Icon size={13} /> {l}</button>);
              })}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: ON, marginBottom: 8 }}>Module style</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[["dashboard", "Dashboard"], ["editorial", "Editorial"]].map(([k, l]) => {
                const on = cardStyle === k;
                return (
                  <button key={k} onClick={() => setCardStyle(k)} style={{ flex: 1, padding: 8, borderRadius: 14, cursor: "pointer", background: "rgba(255,255,255,0.05)", backgroundImage: FABRIC, border: `2px solid ${on ? CREAM : "rgba(236,231,219,0.14)"}`, boxShadow: on ? "0 4px 14px rgba(0,0,0,0.35)" : "none" }}>
                    <StyleMini variant={k} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 12.5, color: on ? ON : ON_MUTED }}>
                      {on && <Check size={13} />} {l}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Section>
        <Section primary={primary} label="Onboarding">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, color: ON_MUTED, lineHeight: 1.4 }}>The first-run setup — how scoring, watch, and tickets work. CourtVisual is designed &amp; built by <a href="https://www.shawncapizzi.com" target="_blank" rel="noopener" style={{ color: ON, fontWeight: 600 }}>Shawn M. Capizzi</a>.</span>
            <button onClick={() => setView("onboarding")} style={chip(false)}>Open setup screen</button>
          </div>
        </Section>
        <Section primary={primary} label="Sports you follow">
          <div style={{ fontSize: 12, color: ON_MUTED, marginBottom: 10, lineHeight: 1.4 }}>These appear in the bottom bar next to your teams — tap one for that sport&rsquo;s ranked slate.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {FOLLOW_SPORTS.map((sp) => {
              const cur = followedSports !== null ? followedSports : FOLLOW_SPORTS.filter((x) => favTeams.some((t) => t.league === x.id)).map((x) => x.id);
              const on = cur.includes(sp.id);
              return (<button key={sp.id} style={chip(on)} onClick={() => { const next = on ? cur.filter((i) => i !== sp.id) : [...cur, sp.id]; setFollowedSports(next); track("follow_sport", { id: sp.id, on: !on }); }}>{sp.label}</button>);
            })}
          </div>
        </Section>
        <Section primary={primary} label="How scoring works">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              ["Playoff stakes", "Championships, knockout rounds, and playoff races — games with something on the line."],
              ["Rivalry", "161 named rivalries, from the Subway Series to El Tr\u00e1fico. History between the teams runs hot."],
              ["Star power", "Marquee players and hot teams, refreshed from live league data."],
              ["Historic weight", "The heritage of the stage and the matchup."],
            ].map(([t, d]) => (
              <div key={t} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span style={{ width: 14, height: 4, borderRadius: 2, background: "#E8401F", flexShrink: 0, position: "relative", top: -2 }} />
                <span style={{ fontSize: 12.5, color: ON_MUTED, lineHeight: 1.45 }}><b style={{ color: ON }}>{t}.</b> {d}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: ON_FAINT, marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
            Every upcoming game gets a 0&ndash;10 score from these four factors, weighted by your excitement sliders. Championship-size games carry a floor &mdash; games that big can&rsquo;t score low.{" "}
            <a href="/about" style={{ color: ON, textDecoration: "underline", textUnderlineOffset: 2 }}>Read the full FAQ</a>.
          </p>
        </Section>
        <Section primary={primary} label="Home market">
          <p style={{ fontSize: 12, color: ON_MUTED, margin: "0 0 10px", lineHeight: 1.4 }}>Used for &ldquo;games near you&rdquo; and your local market.</p>
          <div style={field}><MapPin size={16} color="rgba(236,231,219,0.5)" /><input className="g-in-dark" placeholder="City or region — for games near you" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
        </Section>
        <Section primary={primary} label="Account">
          {session?.user ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: ON_MUTED }}>Signed in as <b style={{ color: ON }}>{session.user.email}</b> — your teams and settings sync to your account.</span>
              <button onClick={signOut} style={chip(false)}>Sign out</button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13.5, color: ON_MUTED, margin: "0 0 12px", lineHeight: 1.45 }}>
                Fast and free — just your email, no password. Your teams and excitement settings stay saved on every device.
              </p>
              <div style={field}><Mail size={16} color="rgba(236,231,219,0.5)" /><input className="g-in-dark" placeholder="you@email.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                <button onClick={sendLink} style={{ ...chip(true), padding: "9px 16px" }}>Send magic link</button>
                {authMsg && <span style={{ fontSize: 12, color: ON_MUTED }}>{authMsg}</span>}
              </div>
              <p style={{ fontSize: 11.5, color: ON_FAINT, marginTop: 10 }}>Optional — sign in to sync across devices. Skip it and everything still saves on this device.</p>
            </div>
          )}
        </Section>
        <button onClick={() => setView("games")} style={{ marginTop: 24, width: "100%", padding: "15px", borderRadius: 12, border: "none", background: CREAM, color: INK, fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 14.5, cursor: "pointer", boxShadow: DEPTH }}>Back to the ranking</button>
      </Shell>
    );
  }

  // ---------- GAMES ----------
  const LEAGUE = (team.league || "").toUpperCase();
  let gamesView;
  {
    let base, sub, context = null;
    if (liveGames) {
      base = liveGames; sub = "Live schedule + prices via Ticketmaster.";
    } else if (slateMode === "league" && leagueGames?.length) {
      base = leagueGames; sub = `Live in the ${LEAGUE} right now.`;
      context = <ContextCard primary={primary} teamRecord={teamRecord} title={`The ${team.name} season has ended`} body={`No upcoming ${team.name} games right now${teamRecord ? ` — they finished ${teamRecord.str}` : ""}. Here's what's live in the ${LEAGUE}, ranked by your taste.`} />;
    } else {
      base = sampleSlate(team); sub = "Example matchups — the season's not live yet.";
      context = <ContextCard primary={primary} teamRecord={teamRecord} title={`The ${LEAGUE} is in its off-season`} body={teamRecord ? `The ${team.name} finished ${teamRecord.str}. Here's a taste of the matchups to come.` : `No games scheduled right now. Here's a taste of the matchups to come.`} />;
    }
    const byDate = (a, b) => {
      // Chronological for trip planning. Use the route's iso date; fall back to ds, TBD last.
      const ax = a.iso || (a.ds && a.ds !== "tbd" ? a.ds : null);
      const bx = b.iso || (b.ds && b.ds !== "tbd" ? b.ds : null);
      if (ax && bx) return ax < bx ? -1 : ax > bx ? 1 : 0;
      if (ax) return -1; if (bx) return 1; return 0; // games without a date sink to the bottom
    };
    const ordered = sortMode === "date"
      ? [...base].sort(byDate)
      : [...base].sort((a, b) => activeScore(b) - activeScore(a));
    gamesView = { sub, context, ranked: ordered };
  }
  if (view === "games") {
    return (
      <Shell>
        <SiteHeader view={view} setView={setView} />
        <div style={{ display: "flex", alignItems: "stretch", gap: 8, marginBottom: 16, position: "relative" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(236,231,219,0.06)", border: "1px solid rgba(236,231,219,0.12)", borderRadius: 12, padding: "11px 14px" }}>
              <Search size={17} color="rgba(236,231,219,0.5)" />
              <input className="g-in-dark" placeholder="Team, sport, or event…" value={jump} onChange={(e) => setJump(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runEventSearch(jump); }} />
              {(jump || eventResults !== null) && <button onClick={clearSearch} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(236,231,219,0.5)", padding: 0, display: "flex" }}><X size={16} /></button>}
            </div>
            {jump.trim() && (
              <div style={{ position: "absolute", zIndex: 30, top: "100%", left: 0, right: 0, marginTop: 6, background: "#fff", borderRadius: 12, boxShadow: DEPTH, border: "1px solid rgba(22,19,15,0.06)", overflow: "hidden" }}>
                {teamMatches.map((t) => (
                  <button key={t.slug} onClick={() => jumpToTeam(t)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid rgba(22,19,15,0.05)", background: "none", cursor: "pointer", textAlign: "left" }}>
                    {dots(t)} <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>{t.label}</span>
                  </button>
                ))}
                <button onClick={() => runEventSearch(jump)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "11px 14px", border: "none", background: "none", cursor: "pointer", textAlign: "left", color: INK }}>
                  <Search size={14} color="rgba(22,19,15,0.55)" /> <span style={{ fontSize: 13.5 }}>Search all events for &ldquo;{jump.trim()}&rdquo;</span>
                </button>
              </div>
            )}
          </div>
          <button aria-label="Filter games" onClick={() => setFilterOpen((v) => !v)} style={{ flexShrink: 0, width: 46, display: "flex", alignItems: "center", justifyContent: "center", background: filterOpen ? "rgba(236,231,219,0.14)" : "rgba(236,231,219,0.06)", color: ON, border: "1px solid rgba(236,231,219,0.12)", borderRadius: 12, cursor: "pointer" }}>
            <SlidersHorizontal size={18} />
          </button>
          {filterOpen && <div onClick={() => setFilterOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 35 }} />}
          {filterOpen && (
            <div style={{ position: "absolute", zIndex: 40, top: "100%", right: 0, marginTop: 6, width: 280, maxWidth: "calc(100vw - 48px)", background: "#fff", borderRadius: 14, boxShadow: DEPTH, border: "1px solid rgba(22,19,15,0.06)", overflow: "hidden" }}>
              <div className="g-eyebrow" style={{ fontSize: 9, color: "rgba(22,19,15,0.5)", padding: "12px 16px 6px", letterSpacing: "0.08em" }}>Find games by</div>
              {FILTERS.map((f) => {
                const Ico = f.icon;
                return (
                  <button key={f.id} onClick={() => runFilter(f.id)} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "12px 16px", border: "none", borderTop: "1px solid rgba(22,19,15,0.05)", background: "none", cursor: "pointer", textAlign: "left", color: INK, fontFamily: "'Archivo',sans-serif", fontSize: 13.5, fontWeight: 600 }}>
                    <Ico size={16} color={f.color} /> {f.label}
                  </button>
                );
              })}
              <button onClick={() => { setFilterOpen(false); setSettingsJump("excitement"); setView("settings"); }} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "12px 16px", border: "none", borderTop: "1px solid rgba(22,19,15,0.08)", background: "rgba(22,19,15,0.03)", cursor: "pointer", textAlign: "left", color: INK, fontFamily: "'Archivo',sans-serif", fontSize: 13, fontWeight: 700 }}>
                <SlidersHorizontal size={16} color={primary} /> Adjust your excitement mix →
              </button>
            </div>
          )}
        </div>

        {eventResults !== null ? (
          <>
            <div className="g-eyebrow" style={{ fontSize: 10, color: ON_MUTED }}><span style={{ ...tick, background: primary }} />Search results</div>
            <h1 className="g-display" style={screenH}>{eventQuery.toUpperCase()}</h1>
            <p style={{ fontSize: 11.5, color: ON_FAINT, marginBottom: 16 }}>{eventLoading ? "Searching Ticketmaster…" : eventResults.length ? "Live events, ranked by your taste." : `No events found for “${eventQuery}.” Try a team, league, or event like “World Cup.”`}</p>
            <button onClick={clearSearch} style={{ marginBottom: 14, background: "none", border: "none", padding: 0, cursor: "pointer", color: ON, fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>← Back to {favTeams.length ? team.name : "my games"}</button>
            {eventResults.length > 0 && (
              <div style={{ display: "inline-flex", gap: 4, padding: 4, marginBottom: 16, background: "rgba(255,255,255,0.07)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                {[["watch", Tv, "Watch"], ["tickets", Ticket, "Tickets"]].map(([k, Icon, label]) => {
                  const on = viewMode === k;
                  return (
                    <button key={k} aria-label={label} onClick={() => { track("view_mode", { mode: k, ctx: "discovery" }); setViewMode(k); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 34, padding: "0 11px", border: "none", cursor: "pointer", borderRadius: 9, fontFamily: "'Archivo',sans-serif", fontSize: 11.5, fontWeight: 700, background: on ? CREAM : "transparent", color: on ? INK : ON_MUTED, boxShadow: on ? "0 1px 3px rgba(0,0,0,0.35)" : "none" }}>
                      <Icon size={14} /> {label}
                    </button>
                  );
                })}
              </div>
            )}
            {renderGames([...eventResults].sort((a, b) => (scoreOf(b, weights) + (b._boost || 0)) - (scoreOf(a, weights) + (a._boost || 0))), null, true)}
          </>
        ) : (
          <>
            {showTopper && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 13px", borderRadius: 12, background: "rgba(236,231,219,0.08)", border: "1px solid rgba(236,231,219,0.14)", opacity: topperGone ? 0 : 1, transition: "opacity 0.6s ease", color: ON, fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 700 }}>
                <Zap size={14} color={primary} /> Ranked for your taste — your top games right now
              </div>
            )}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <h1 className="g-display" style={{ ...screenH, minWidth: 0 }}>{team.label.toUpperCase()}</h1>
              <div style={{ display: "inline-flex", gap: 4, padding: 4, marginTop: 14, flexShrink: 0, background: "rgba(255,255,255,0.07)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                {[["watch", Tv, "Watch"], ["tickets", Ticket, "Tickets"]].map(([k, Icon, label]) => {
                  const on = viewMode === k;
                  return (
                    <button key={k} aria-label={label} onClick={() => { track("view_mode", { mode: k }); setViewMode(k); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 34, padding: "0 11px", border: "none", cursor: "pointer", borderRadius: 9, fontFamily: "'Archivo',sans-serif", fontSize: 11.5, fontWeight: 700, background: on ? CREAM : "transparent", color: on ? INK : ON_MUTED, boxShadow: on ? "0 1px 3px rgba(0,0,0,0.35)" : "none" }}>
                      <Icon size={14} /> {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: ON_MUTED, margin: "2px 0 3px" }}>Upcoming · {sortMode === "date" ? "in date order" : "ranked for you"}</p>
            <p style={{ fontSize: 11.5, color: ON_FAINT, marginBottom: 12 }}>{gamesView.sub}</p>
            {liveGames && (
              <div style={{ display: "inline-flex", gap: 3, padding: 3, marginBottom: 16, background: "rgba(255,255,255,0.07)", borderRadius: 11, border: "1px solid rgba(255,255,255,0.06)" }}>
                {[["score", Flame, "By score"], ["date", Calendar, "By date"]].map(([k, Icon, label]) => {
                  const on = sortMode === k;
                  return (
                    <button key={k} onClick={() => { track("sort_mode", { mode: k }); setSortMode(k); setVisible(8); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 13px", border: "none", cursor: "pointer", borderRadius: 9, fontFamily: "'Archivo',sans-serif", fontSize: 11.5, fontWeight: 700, background: on ? CREAM : "transparent", color: on ? INK : ON_MUTED, boxShadow: on ? "0 1px 3px rgba(0,0,0,0.35)" : "none" }}>
                      <Icon size={13} /> {label}
                    </button>
                  );
                })}
              </div>
            )}
            {gamesView.context}
            {renderGames(gamesView.ranked, team.league, false, liveGames && sortMode === "date")}
            <button onClick={() => { setSettingsJump("excitement"); setView("settings"); }} style={{ marginTop: 8, background: "none", border: "none", padding: 0, cursor: "pointer", color: ON, fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <SlidersHorizontal size={14} /> Set your teams & excitement
            </button>
                    </>
        )}
        {/* Share-intent picker — three score-aware captions in the app's voice */}
        {shareGame && (
          <div onClick={() => { setShareGame(null); setShareIntent(null); }} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(5,7,10,0.55)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#14181F", borderTopLeftRadius: 22, borderTopRightRadius: 22, border: "1px solid rgba(236,231,219,0.12)", borderBottom: "none", padding: "20px 18px calc(20px + env(safe-area-inset-bottom))", boxShadow: "0 -20px 60px rgba(0,0,0,0.5)" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(236,231,219,0.2)", margin: "0 auto 16px" }} />
              <div className="g-eyebrow" style={{ fontSize: 9, color: ON_MUTED, textAlign: "center", marginBottom: 4 }}>{shareIntent ? "Send it" : "Share this game"}</div>
              <div style={{ textAlign: "center", fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 14, color: ON, marginBottom: 16 }}>{team.name} vs {shareGame.opp}</div>
              {!shareIntent ? (
                <>
                  {[
                    ["watch", <Tv size={16} />, "Let's watch this one"],
                    ["go", <Ticket size={16} />, "Let's go to this"],
                    ["hype", <Flame size={16} />, "Gotta-see game"],
                  ].map(([intent, icon, label]) => (
                    <button key={intent} onClick={() => setShareIntent(intent)}
                      style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px", marginBottom: 9, borderRadius: 13, border: "1px solid rgba(236,231,219,0.14)", background: "rgba(255,255,255,0.04)", color: ON, fontFamily: "'Archivo',sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
                      <span style={{ color: primary, display: "inline-flex" }}>{icon}</span> {label}
                    </button>
                  ))}
                  <button onClick={() => setShareGame(null)} style={{ width: "100%", padding: "12px", marginTop: 4, background: "none", border: "none", color: ON_MUTED, fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 9, marginBottom: 4 }}>
                    {[
                      ["sms", <Mail size={20} />, "Text it"],
                      ["copy", <ArrowUpRight size={20} />, shared === shareGame.oppSlug + "-copied" ? "Copied!" : "Copy link"],
                      ["native", <Share2 size={20} />, "More"],
                    ].map(([channel, icon, label]) => {
                      const deep = deepen(primary, 0.16);
                      return (
                        <button key={channel} onClick={() => sendVia(shareGame, shareIntent, channel)}
                          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 9, padding: "18px 8px", borderRadius: 14, border: "1px solid rgba(236,231,219,0.10)",
                            backgroundColor: deep,
                            backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 6px), radial-gradient(120% 90% at 50% -10%, rgba(255,255,255,0.10), rgba(255,255,255,0) 55%), linear-gradient(180deg, ${deep} 0%, ${shade(deep, 0.4)} 100%)`,
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 5px 14px rgba(0,0,0,0.32)",
                            color: "#ECE7DB", fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>
                          <span style={{ display: "inline-flex", color: "#FF5A2C" }}>{icon}</span> {label}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => setShareIntent(null)} style={{ width: "100%", padding: "12px", marginTop: 8, background: "none", border: "none", color: ON_MUTED, fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>← Back</button>
                </>
              )}
            </div>
          </div>
        )}
        {/* Switcher bar — teams and sports as equal follows, always one thumb away */}
        <div style={{ height: 76 }} aria-hidden="true" />
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto", width: "100%", maxWidth: 540, background: "rgba(10,13,18,0.86)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderTop: "1px solid rgba(236,231,219,0.10)", padding: "8px 12px calc(10px + env(safe-area-inset-bottom))" }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.06em", color: ON_MUTED, fontFamily: "'Archivo',sans-serif", fontWeight: 700, textTransform: "uppercase", textAlign: "center", marginBottom: 7 }}>Swap your team or league below</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
              {favTeams.map((t) => {
                const on = !eventQuery && primarySlug === t.slug;
                const tColor = t.primary || CREAM;
                return (
                  <button key={t.slug} onClick={() => { track("bar_switch", { kind: "team", id: t.slug }); setEventResults(null); setEventQuery(""); setPrimarySlug(t.slug); }}
                    style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 999, border: `1.5px solid ${on ? tColor : "rgba(236,231,219,0.22)"}`, background: on ? tColor : "rgba(255,255,255,0.05)", color: on ? textOn(tColor) : ON, fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 700, cursor: "pointer", boxShadow: on ? "0 2px 10px rgba(0,0,0,0.35)" : "none" }}>
                    {dots(t)} {t.name}
                  </button>
                );
              })}
              {barSports.map((sp) => {
                const on = eventQuery === sp.label;
                return (
                  <button key={sp.id} onClick={() => runSportFeed(sp)}
                    style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 999, border: `1.5px solid ${on ? "#FF5A2C" : "rgba(236,231,219,0.22)"}`, background: on ? "#FF5A2C" : "rgba(255,255,255,0.05)", color: on ? "#FFFFFF" : ON, fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 700, cursor: "pointer", boxShadow: on ? "0 2px 10px rgba(0,0,0,0.35)" : "none" }}>
                    {sp.label}
                  </button>
                );
              })}
              <button onClick={() => setView("onboarding")} aria-label="Add teams or sports"
                style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 35, borderRadius: 999, border: "1px dashed rgba(236,231,219,0.25)", background: "none", color: ON_MUTED, cursor: "pointer" }}>
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }
}
