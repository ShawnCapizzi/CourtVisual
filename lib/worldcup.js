// CourtVisual — World Cup fixtures via ESPN's hidden soccer API (league slug "fifa.world").
// Fixture-first: the schedule is the source of truth, NOT ticket inventory, so every match
// exists in the app even when no ticket is listed. Output matches the game shape the cards
// already consume (see eventToGame in app/api/games/route.js): matchup/opp/oppSlug/oppId/date/
// ds/iso/dow/home/tag/playoff/rivalry/hot/historic/topRivals/rivalryName/url/venue, plus extra
// ESPN fields (team colors + logos) that are ready for per-team polish later.
//
// No API key needed. ESPN is the same family the app already uses for broadcasts + standings.

const ESPN_WC = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
// Official FIFA tickets page for the 2026 tournament (the primary ticket route per the data plan).
const FIFA_TICKETS = "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/tickets";
// Whole-tournament window in one cached call (limit covers all 104 matches). 2026: Jun 11 – Jul 19.
const WC_WINDOW = "20260611-20260720";

const slugify = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const nick = (s) => (s || "").trim().split(/\s+/).pop();

// Big draws get an interest bump; a few marquee national rivalries get the full rivalry treatment.
const MARQUEE = ["argentina", "brazil", "france", "england", "spain", "germany", "portugal", "netherlands", "italy", "belgium", "united states", "usa", "mexico", "uruguay", "croatia"];
const WC_RIVALRIES = [
  ["argentina", "brazil"], ["united states", "mexico"], ["usa", "mexico"], ["england", "germany"],
  ["spain", "portugal"], ["netherlands", "germany"], ["argentina", "england"], ["brazil", "uruguay"],
];
const isMarquee = (n) => MARQUEE.some((m) => n.includes(m));

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    const date = `${d.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" })} \u00b7 ${d.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })}`;
    const ds = d.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "2-digit", day: "2-digit" }).replace("/", "-");
    return { date, ds };
  } catch { return { date: "TBD", ds: "tbd" }; }
}
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const dowOf = (iso) => { try { return DOW[new Date(iso).toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" })] ?? null; } catch { return null; } };

// Map an event to its tournament round using the league calendar (date ranges) the payload ships,
// so this keeps working as the bracket advances without hardcoding match numbers.
function roundFor(dateISO, calendar) {
  const t = new Date(dateISO).getTime();
  for (const e of calendar || []) {
    const s = new Date(e.startDate).getTime(), en = new Date(e.endDate).getTime();
    if (t >= s && t <= en) return e.label || "";
  }
  return "";
}

// Round -> stakes tag + playoff/historic factors. Knockouts carry a stakes floor via the tag
// (lib/data STAKES_FLOOR: "Championship" 9.0, "Knockout stage" 8.2). Group games score on merit.
function stakesFor(round, groupNote) {
  const r = (round || "").toLowerCase();
  if (/\bfinal\b/.test(r) && !/3rd|semi|quarter/.test(r)) return { tag: "Championship", playoff: 10, historic: 10 };
  if (/semifinal/.test(r)) return { tag: "Knockout stage", playoff: 9.5, historic: 9 };
  if (/quarterfinal/.test(r)) return { tag: "Knockout stage", playoff: 9, historic: 9 };
  if (/16/.test(r)) return { tag: "Knockout stage", playoff: 8.5, historic: 8.5 };
  if (/32/.test(r)) return { tag: "Knockout stage", playoff: 8, historic: 8 };
  if (/3rd/.test(r)) return { tag: "Knockout stage", playoff: 7.5, historic: 8 };
  return { tag: groupNote || "Group stage", playoff: 6.5, historic: 8 };
}

const mlNum = (s) => { const n = parseInt(String(s).replace(/[+\s]/g, ""), 10); return Number.isFinite(n) ? n : null; };

// Closeness from the moneyline: a small favorite = a tight, watchable game; a heavy favorite =
// a likely blowout. Falls back to neutral when no odds are attached.
function matchupHot(odds) {
  const ml = odds && odds[0] && odds[0].moneyline;
  const h = mlNum(ml && ml.home && ml.home.close && ml.home.close.odds);
  const a = mlNum(ml && ml.away && ml.away.close && ml.away.close.odds);
  if (h == null || a == null) return 6;
  const favMag = Math.min(Math.abs(h), Math.abs(a));
  return Math.round(Math.max(3.5, Math.min(9.5, 9.5 - (favMag - 120) / 70)) * 10) / 10;
}

function interestRivalry(homeName, awayName) {
  const a = (homeName || "").toLowerCase(), b = (awayName || "").toLowerCase();
  for (const [x, y] of WC_RIVALRIES) {
    if ((a.includes(x) && b.includes(y)) || (a.includes(y) && b.includes(x))) return { rivalry: 9, top: true };
  }
  const am = isMarquee(a), bm = isMarquee(b);
  let r = am && bm ? 8 : am || bm ? 6 : 3;
  if (a.includes("united states") || a.includes("usa") || b.includes("united states") || b.includes("usa")) r = Math.min(10, r + 2);
  return { rivalry: r, top: false };
}

const hex = (c) => (c ? `#${String(c).replace(/^#/, "")}` : null);

export function eventToGame(ev, calendar) {
  const comp = ev.competitions && ev.competitions[0];
  if (!comp) return null;
  const cs = comp.competitors || [];
  const home = cs.find((c) => c.homeAway === "home") || cs[0];
  const away = cs.find((c) => c.homeAway === "away") || cs[1];
  if (!home || !away) return null;
  const hn = (home.team && (home.team.displayName || home.team.name)) || "TBD";
  const an = (away.team && (away.team.displayName || away.team.name)) || "TBD";
  const matchup = `${hn} vs ${an}`;
  const round = roundFor(ev.date, calendar);
  const gm = (comp.altGameNote || "").match(/group\s+([a-l])/i);
  const groupNote = gm ? `Group ${gm[1].toUpperCase()}` : null;
  const s = stakesFor(round, groupNote);
  const { rivalry, top } = interestRivalry(hn, an);
  const { date, ds } = fmtDate(ev.date);
  return {
    matchup, opp: an, oppSlug: slugify(`${matchup}-${ds}`).slice(0, 60), oppId: (away.team && away.team.id) || null,
    date, ds, iso: ev.date || null, dow: dowOf(ev.date), home: false,
    sport: "soccer", league: "worldcup",
    tag: s.tag, playoff: s.playoff, rivalry, hot: matchupHot(comp.odds), historic: s.historic,
    topRivals: top, rivalryName: top ? `${nick(hn)} v ${nick(an)}` : null,
    url: FIFA_TICKETS, venue: (comp.venue && comp.venue.fullName) || null,
    city: (comp.venue && comp.venue.address && comp.venue.address.city) || null,
    // Extra ESPN data, ready for per-team badges/colors later (kept off the theme for now).
    homeTeam: hn, awayTeam: an,
    homeColor: hex(home.team && home.team.color), awayColor: hex(away.team && away.team.color),
    homeLogo: (home.team && home.team.logo) || null, awayLogo: (away.team && away.team.logo) || null,
    status: (comp.status && comp.status.type && comp.status.type.state) || "pre",
  };
}

export async function fetchWorldCupGames() {
  const res = await fetch(`${ESPN_WC}?limit=400&dates=${WC_WINDOW}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`espn_${res.status}`);
  const data = await res.json();
  const calendar = (data.leagues && data.leagues[0] && data.leagues[0].calendar && data.leagues[0].calendar[0] && data.leagues[0].calendar[0].entries) || [];
  const events = data.events || [];
  const seen = new Set();
  const out = [];
  for (const ev of events) {
    const g = eventToGame(ev, calendar);
    if (!g) continue;
    if (g.status === "post") continue; // upcoming + live only, like the rest of the feeds
    if (seen.has(g.oppSlug)) continue;
    seen.add(g.oppSlug);
    out.push(g);
  }
  return out;
}
