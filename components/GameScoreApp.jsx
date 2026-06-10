"use client";
import React, { useEffect, useMemo, useState, useRef, useId } from "react";
import { Search, Plus, X, Share2, ChevronDown, MapPin, Check, ArrowUpRight, Star, User, Calendar, Ticket, Flame, Mail, SlidersHorizontal, Trophy, Zap } from "lucide-react";
import { TEAMS, teamBySlug, FACTORS, PRESETS, DEFAULT_WEIGHTS, sampleSlate, scoreOf, verdict, shade, textOn } from "../lib/data";
import { store, loadRemote, saveRemote } from "../lib/storage";
import { supabase } from "../lib/supabaseClient";

const PAGE = "#E7E3D8", INK = "#16130F";
const ON = "#ECE7DB", ON_MUTED = "rgba(236,231,219,0.60)", ON_FAINT = "rgba(236,231,219,0.40)", HAIR = "rgba(236,231,219,0.14)";
const CREAM = "#ECE7DB"; /* solid cream replaces the old foil gradient on CTAs and active chips */
const DEPTH = "0 1px 2px rgba(18,20,28,0.07), 0 6px 16px rgba(18,20,28,0.10), 0 22px 48px rgba(18,20,28,0.12)";
// Very-light jersey weave for the dialed-back card magic on the Favorites surfaces (lighter + coarser than the game card's)
const FABRIC = "repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 5px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 5px)";
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`; };
const mulHex = (hex, k) => { const n = parseInt(hex.slice(1), 16); const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k); return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1); };
// Scale a team color down to a target luminance -> a clean, deep, readable team tone (no gray mud).
const deepen = (hex, target) => { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = (n & 255); const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; const k = lum > target ? target / lum : 1; r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * k); return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1); };
const SPORTS = [{ id: "nfl", label: "Football" }, { id: "nba", label: "Basketball" }, { id: "mlb", label: "Baseball" }, { id: "nhl", label: "Hockey" }, { id: "mls", label: "Soccer" }, { id: "wnba", label: "WNBA" }, { id: "boxing", label: "Boxing" }];

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
              <div style={{ width: `${g[f.key] * 10}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${accent}, ${shade(accent, 0.28)})` }} />
            </div>
            <span style={{ fontSize: 11, color: txt, width: 64, textAlign: "right", flexShrink: 0 }}>{g[f.key]} · {pct}%</span>
          </div>
        );
      })}
    </div>
  );
}


function GameModule({ rank, game, teamName, weights, style, primary, secondary, reaction, onReact, onShare, shared, laser, isTouch }) {
  const score = scoreOf(game, weights);
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
          : <div className="g-display" style={{ fontSize: 58, lineHeight: 0.8, backgroundImage: "linear-gradient(135deg,#FFA52B 0%,#FF5A2C 55%,#B3122A 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "#FF5A2C" }}>{anim.toFixed(1)}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="g-display" style={{ fontSize: 21, color: ink }}>{game.matchup ? game.matchup.toUpperCase() : `VS ${(game.opp || "TBD").toUpperCase()}`}</span>
            {game.topRivals ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 999, background: hexA(secondary, 0.16), border: `1px solid ${hexA(secondary, 0.34)}`, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.02em" }}>
                <Flame size={10} /> Top Rivals
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

      <button onClick={() => onShare(game, "buy")}
        style={{ width: "100%", marginTop: 14, padding: "13px 16px", borderRadius: 13, border: "none", cursor: "pointer",
          color: textOn(secondary), backgroundColor: secondary,
          backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.032) 0 1px, transparent 1px 7px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.032) 0 1px, transparent 1px 7px), linear-gradient(180deg, ${secondary} 0%, ${shade(secondary, 0.12)} 100%)`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.34), 0 6px 15px rgba(0,0,0,0.30)",
          fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: game.minPrice ? "space-between" : "center", gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Ticket size={15} /> Get tickets <ArrowUpRight size={13} /></span>
        {game.minPrice ? <span style={{ fontWeight: 800 }}>From ${game.minPrice}</span> : null}
      </button>

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
      {open && <div style={{ paddingTop: 8, paddingBottom: 6 }}><Bars g={game} accent={primary} weights={weights} dark={dark} /></div>}

    </div>
  );
  return body;
}

const chip = (active) => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: `1px solid ${active ? "transparent" : "rgba(236,231,219,0.20)"}`, background: active ? CREAM : "transparent", color: active ? INK : ON, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Archivo',sans-serif" });
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
      <div style={{ position: "relative", zIndex: 1, maxWidth: 540, margin: "0 auto", padding: "26px 20px calc(48px + env(safe-area-inset-bottom))" }}>{children}</div>
    </div>
  );
}

function Nav({ view, setView }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <LogoPlate />
      <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "rgba(255,255,255,0.07)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
        {[["games", "Games"], ["favorites", "Favorites"]].map(([k, l]) => {
          const on = view === k;
          return (<button key={k} onClick={() => setView(k)} style={{ border: "none", cursor: "pointer", fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 600, padding: "7px 16px", borderRadius: 9, background: on ? CREAM : "transparent", color: on ? INK : ON_MUTED, boxShadow: on ? "0 1px 3px rgba(0,0,0,0.35)" : "none" }}>{l}</button>);
        })}
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

function LogoPlate() {
  return (
    <span className="g-display" style={{ fontSize: "clamp(20px, 5.6vw, 25px)", lineHeight: 1, letterSpacing: "0.01em", color: ON }}>
      Court<span style={{ color: "#E1641F" }}>Visual</span>
    </span>
  );
}

export default function GameScoreApp() {
  const [view, setView] = useState("onboarding");
  const [teamSlugs, setTeamSlugs] = useState([]);
  const [primarySlug, setPrimarySlug] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerInput, setPlayerInput] = useState("");
  const [location, setLocation] = useState("");
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [preset, setPreset] = useState("balanced");
  const [cardStyle, setCardStyle] = useState("dashboard");
  const [override, setOverride] = useState(null);
  const [q, setQ] = useState("");
  const [reactions, setReactions] = useState({});
  const [shared, setShared] = useState(null);
  const [session, setSession] = useState(null);
  const [isTouch, setIsTouch] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  const snapshot = { teams: teamSlugs, primary: primarySlug, players, location, weights, preset, cardStyle, override, reactions };
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
    if (st.override !== undefined) setOverride(st.override);
    if (st.reactions) setReactions(st.reactions);
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
    if (s.override !== undefined) setOverride(s.override);
    if (s.reactions) setReactions(s.reactions);
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
  useEffect(() => { try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch { window.scrollTo(0, 0); } }, [view]);

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
  const onReact = (slug, id) => setReactions((r) => ({ ...r, [slug]: id }));
  const sendLink = async () => {
    if (!authEmail.trim()) return;
    setAuthMsg("Sending\u2026");
    const { error } = await supabase.auth.signInWithOtp({ email: authEmail.trim(), options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined } });
    setAuthMsg(error ? error.message : "Check your email for a sign-in link.");
  };
  const signOut = async () => { await supabase.auth.signOut(); setAuthMsg(""); };
  const onShare = (g, kind) => {
    if (kind === "buy") { window.open(g.url || `https://www.ticketmaster.com/search?q=${encodeURIComponent(team.name + " vs " + g.opp)}`, "_blank", "noopener,noreferrer"); return; }
    if (kind === "gift") { window.open(g.url || `https://www.ticketmaster.com/search?q=${encodeURIComponent(team.name + " vs " + g.opp)}`, "_blank", "noopener,noreferrer"); return; }
    const score = scoreOf(g, weights).toFixed(1);
    const origin = typeof window !== "undefined" ? window.location.origin : "https://courtvisual.com";
    const url = `${origin}/g/${team.slug}-vs-${g.oppSlug}-${g.ds}?s=${score}`;
    const data = { title: `${team.name} vs ${g.opp}`, text: `${team.name} vs ${g.opp}`, url };
    try { if (navigator.share) { navigator.share(data).catch(() => {}); return; } } catch {}
    try { navigator.clipboard?.writeText(url); } catch {}
    setShared(g.oppSlug); setTimeout(() => setShared(null), 1600);
  };


  // ---------- ranked list renderer (progressive "Show more" + rivalry focus) ----------
  const STEP = 8;
  // When rivalry is ~the only thing the fan weights (>=90% share), show ONLY
  // rivalry matchups instead of padding the list with non-rivalry games.
  const RIVALRY_FOCUS = 0.9;
  const wTotal = (weights.playoff + weights.rivalry + weights.hot + weights.historic) || 1;
  const rivalryOnly = weights.rivalry / wTotal >= RIVALRY_FOCUS;

  const renderGames = (list) => {
    let full = list;
    let note = null;
    if (rivalryOnly) {
      const rivals = list.filter((g) => g.topRivals || g.rivalry > 4);
      if (rivals.length) { full = rivals; note = "Rivalry focus — showing rivalry matchups only."; }
      else { note = "No rivalry games on this schedule right now — showing the full ranking."; }
    }
    const shown = full.slice(0, visible);
    const remaining = full.length - shown.length;
    return (
      <>
        {note && (
          <div style={{ fontSize: 11.5, fontWeight: 600, color: ON_MUTED, marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Flame size={12} color="#FF5A2C" /> {note}
          </div>
        )}
        {shown.map((g, i) => (
          <GameModule key={(g.matchup || g.oppSlug) + i} rank={i + 1} game={g} teamName={team.name} weights={weights} style={cardStyle}
            primary={primary} secondary={secondary} onShare={onShare} shared={shared === g.oppSlug} laser={i === 0} isTouch={isTouch} />
        ))}
        {remaining > 0 && (
          <button onClick={() => setVisible((v) => v + STEP)} style={{ width: "100%", marginTop: 4, marginBottom: 4, padding: "13px", borderRadius: 12, cursor: "pointer", background: "#fff", border: "1px solid rgba(22,19,15,0.1)", boxShadow: DEPTH, color: INK, fontFamily: "'Archivo',sans-serif", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            Show {Math.min(STEP, remaining)} more {remaining === 1 ? "game" : "games"} <ChevronDown size={15} />
          </button>
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
    { id: "weekend", label: "Games this weekend near you", icon: MapPin, color: "#FF5A2C" },
    { id: "hot", label: "Hottest games of the season", icon: Flame, color: "#B3122A" },
    { id: "rivalry", label: "Rivalry showdowns", icon: Zap, color: "#E8401F" },
    { id: "stakes", label: "Championship & playoff games", icon: Trophy, color: "#0F4A18" },
  ];
  const runFilter = async (kind) => {
    if (kind === "weekend") { weekendNearMe(); return; }
    const label = (FILTERS.find((f) => f.id === kind) || {}).label || "Hot games";
    beginSearch(label);
    try {
      const r = await fetch("/api/games?hot=1"); const d = await r.json();
      let g = d.games || [];
      if (kind === "rivalry") g = g.filter((x) => x.topRivals || x.rivalry >= 7);
      if (kind === "stakes") g = g.filter((x) => x.playoff >= 7 || x.historic >= 8);
      setEventResults(g);
    } catch { setEventResults([]); }
    setEventLoading(false);
  };

  const screenH = { fontSize: 40, margin: "10px 0 6px", color: ON };

  // ---------- ONBOARDING ----------
  if (view === "onboarding") {
    return (
      <Shell>
        <div style={{ marginBottom: 20 }}><LogoPlate /></div>
        <div className="g-eyebrow" style={{ fontSize: 10, color: ON_MUTED }}><span style={tick} />Welcome</div>
        <h1 className="g-display" style={{ ...screenH, fontSize: 42 }}>FIND YOUR<br />TEAM</h1>
        <p style={{ fontSize: 15, fontWeight: 700, color: ON, marginTop: 14, lineHeight: 1.4 }}>
          Welcome to CourtVisual — the ticket app customized for you, by you.
        </p>
        <p style={{ fontSize: 13.5, color: ON_MUTED, marginTop: 8, lineHeight: 1.45 }}>
          You set what makes a game exciting. We score and rank every game to match.
        </p>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["Dial it in", "Weight four factors — playoff stakes, rivalry, star power, historic weight."],
            ["Get the ranking", "Every upcoming game scored 0\u201310, ranked for you."],
            ["Share the heat", "Send must-sees to friends and plan the night."],
          ].map(([t, d]) => (
            <div key={t} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span style={{ ...tick, flexShrink: 0, marginRight: 0 }} />
              <span style={{ fontSize: 13.5, color: ON_MUTED, lineHeight: 1.45 }}><b style={{ color: ON }}>{t}.</b> {d}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: ON_MUTED, marginTop: 16 }}>Pick your team to start — the app themes to its colors.</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid rgba(22,19,15,0.06)", boxShadow: DEPTH, borderRadius: 14, padding: "13px 16px", marginTop: 22 }}>
          <Search size={18} color="rgba(22,19,15,0.55)" />
          <input className="g-in" placeholder="Search a team, sport, place, or event…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        </div>
        {favTeams.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {favTeams.map((t) => (<span key={t.slug} style={chip(true)} onClick={() => removeTeam(t)}>{dots(t)} {t.name} <X size={13} /></span>))}
          </div>
        )}
        <div className="g-eyebrow" style={{ fontSize: 9, color: ON_MUTED, margin: "22px 0 10px" }}>{q.trim() ? "Results" : "Popular"}</div>
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
        <div style={{ marginTop: 24 }}>
          <div className="g-eyebrow" style={{ fontSize: 9, color: ON_MUTED, marginBottom: 10 }}>Choose your view · change anytime</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[["dashboard", "Dashboard"], ["editorial", "Editorial"]].map(([k, l]) => {
              const on = cardStyle === k;
              return (
                <button key={k} onClick={() => setCardStyle(k)} style={{ flex: 1, padding: 8, borderRadius: 14, cursor: "pointer", background: "#fff", border: `2px solid ${on ? INK : "rgba(22,19,15,0.12)"}`, boxShadow: on ? DEPTH : "none" }}>
                  <StyleMini variant={k} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 12.5, color: INK }}>
                    {on && <Check size={13} />} {l}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button disabled={!teamSlugs.length} onClick={() => setView("games")}
          style={{ marginTop: 30, width: "100%", padding: "15px", borderRadius: 12, border: "none", background: teamSlugs.length ? CREAM : "rgba(255,255,255,0.08)", color: teamSlugs.length ? INK : ON_FAINT, fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 14.5, cursor: teamSlugs.length ? "pointer" : "default", boxShadow: teamSlugs.length ? DEPTH : "none" }}>
          {teamSlugs.length ? `Continue with ${teamSlugs.length} team${teamSlugs.length > 1 ? "s" : ""}` : "Add a team to continue"}
        </button>
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
    gamesView = { sub, context, ranked: [...base].sort((a, b) => scoreOf(b, weights) - scoreOf(a, weights)) };
  }
  if (view === "games") {
    return (
      <Shell>
        <Nav view={view} setView={setView} />
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
            </div>
          )}
        </div>

        {eventResults !== null ? (
          <>
            <div className="g-eyebrow" style={{ fontSize: 10, color: ON_MUTED }}><span style={{ ...tick, background: primary }} />Search results</div>
            <h1 className="g-display" style={screenH}>{eventQuery.toUpperCase()}</h1>
            <p style={{ fontSize: 11.5, color: ON_FAINT, marginBottom: 16 }}>{eventLoading ? "Searching Ticketmaster…" : eventResults.length ? "Live events, ranked by your taste." : `No events found for “${eventQuery}.” Try a team, league, or event like “World Cup.”`}</p>
            <button onClick={clearSearch} style={{ marginBottom: 14, background: "none", border: "none", padding: 0, cursor: "pointer", color: ON, fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>← Back to {team.name}</button>
            {renderGames([...eventResults].sort((a, b) => scoreOf(b, weights) - scoreOf(a, weights)))}
          </>
        ) : (
          <>
            {favTeams.length > 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {favTeams.map((t) => (<span key={t.slug} style={chip(primarySlug === t.slug)} onClick={() => setPrimarySlug(t.slug)}>{dots(t)} {t.name}</span>))}
              </div>
            )}
            <h1 className="g-display" style={screenH}>{team.label.toUpperCase()}</h1>
            <p style={{ fontSize: 12.5, color: ON_MUTED, margin: "2px 0 3px" }}>Upcoming · ranked for you</p>
            <p style={{ fontSize: 11.5, color: ON_FAINT, marginBottom: 16 }}>{gamesView.sub}</p>
            {gamesView.context}
            {renderGames(gamesView.ranked)}
            <button onClick={() => setView("favorites")} style={{ marginTop: 8, background: "none", border: "none", padding: 0, cursor: "pointer", color: ON, fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Star size={14} /> Tune your favorites & view
            </button>
          </>
        )}
      </Shell>
    );
  }

  // ---------- FAVORITES ----------
  const field = { display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", backgroundImage: FABRIC, border: "1px solid rgba(236,231,219,0.10)", borderRadius: 12, padding: "12px 14px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" };

  return (
    <Shell>
      <Nav view={view} setView={setView} />
      <h1 className="g-display" style={screenH}>FAVORITES</h1>
            <Section primary={primary} label="Teams">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {favTeams.map((t) => (<span key={t.slug} style={chip(primarySlug === t.slug)} onClick={() => setPrimarySlug(t.slug)}>{dots(t)} {t.name} <X size={12} onClick={(e) => { e.stopPropagation(); removeTeam(t); }} /></span>))}
          <button style={chip(false)} onClick={() => setView("onboarding")}><Plus size={13} /> Add</button>
        </div>
      </Section>
      <Section primary={primary} label="Type of excitement you want">
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
      </Section>
      <Section primary={primary} label="Account">
        {session?.user ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: ON_MUTED }}>Signed in as <b style={{ color: ON }}>{session.user.email}</b> — favorites sync to your account.</span>
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
      <Section primary={primary} label="Sport focus">
        <p style={{ fontSize: 12.5, color: ON_MUTED, margin: "0 0 12px", lineHeight: 1.4 }}>Pick a sport to pull up its teams — tap to follow. Come back anytime to add more.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: sportFocus ? 14 : 0 }}>
          {SPORTS.map((sp) => (<button key={sp.id} style={chip(sportFocus === sp.id)} onClick={() => setSportFocus(sportFocus === sp.id ? null : sp.id)}>{sp.label}</button>))}
        </div>
        {sportFocus === "boxing" && (
          <p style={{ fontSize: 13, color: ON_MUTED, lineHeight: 1.45, margin: 0 }}>Big fights are coming soon. For now, search any bout from the search bar on the Games tab.</p>
        )}
        {sportFocus && sportFocus !== "boxing" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TEAMS.filter((t) => t.league === sportFocus).map((t) => {
              const on = teamSlugs.includes(t.slug);
              return (<button key={t.slug} style={chip(on)} onClick={() => (on ? removeTeam(t) : addTeam(t))}>{dots(t)} {t.name} {on ? <Check size={12} /> : <Plus size={12} />}</button>);
            })}
          </div>
        )}
      </Section>
      <Section primary={primary} label="Players you follow">
        <div style={field}>
          <User size={16} color="rgba(236,231,219,0.5)" />
          <input className="g-in-dark" placeholder="Add a player…" value={playerInput} onChange={(e) => setPlayerInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && playerInput.trim()) { setPlayers([...players, playerInput.trim()]); setPlayerInput(""); } }} />
        </div>
        {players.length > 0 && (<div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>{players.map((p, i) => (<span key={i} style={chip(true)} onClick={() => setPlayers(players.filter((_, j) => j !== i))}>{p} <X size={12} /></span>))}</div>)}
      </Section>
      <Section primary={primary} label="Home market">
        <div style={field}><MapPin size={16} color="rgba(236,231,219,0.5)" /><input className="g-in-dark" placeholder="City or region — for games near you" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
      </Section>
            <Section primary={primary} label="Module style">
        <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "rgba(255,255,255,0.07)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
          {[["dashboard", "Dashboard"], ["editorial", "Editorial"]].map(([k, l]) => {
            const on = cardStyle === k;
            return (<button key={k} onClick={() => setCardStyle(k)} style={{ border: "none", cursor: "pointer", fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 600, padding: "7px 18px", borderRadius: 9, background: on ? CREAM : "transparent", color: on ? INK : ON_MUTED, boxShadow: on ? "0 1px 3px rgba(0,0,0,0.35)" : "none" }}>{l}</button>);
          })}
        </div>
      </Section>
      <Section primary={primary} label="Override accent (optional)">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {["#E8401F", "#1E73E8", "#2FA02F", "#7A5AF8", "#E8407F", "#14B8A6"].map((c) => (
            <button key={c} onClick={() => setOverride(c)} aria-label={`accent ${c}`} style={{ width: 26, height: 26, borderRadius: 999, background: c, cursor: "pointer", border: override === c ? "2px solid #16130F" : "2px solid transparent", outline: override === c ? "2px solid #fff" : "none", outlineOffset: -4 }} />
          ))}
          {override && <button onClick={() => setOverride(null)} style={{ ...chip(false), padding: "5px 10px" }}>Reset to team</button>}
        </div>
      </Section>
      <button onClick={() => setView("games")} style={{ marginTop: 24, width: "100%", padding: "15px", borderRadius: 12, border: "none", background: CREAM, color: INK, fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 14.5, cursor: "pointer", boxShadow: DEPTH }}>See the ranking</button>
    </Shell>
  );
}
