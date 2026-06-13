// CourtVisual odds layer — pregame spreads from The Odds API, the best signal
// for Matchup (competitiveness). Server-only: reads process.env.ODDS_API_KEY,
// which must NOT carry a NEXT_PUBLIC_ prefix (that would inline it into the
// browser bundle and leak the 500/month free quota). Graceful + cached: any
// failure or missing key returns an empty map and Matchup falls back to records.
//
// parseOdds is pure and fixture-tested; fetchSpreadMap is the I/O wrapper.

// The Odds API sport keys for the leagues we cover.
const SPORT_KEYS = {
  nba: "basketball_nba",
  wnba: "basketball_wnba",
  mlb: "baseball_mlb",
  nfl: "americanfootball_nfl",
  nhl: "icehockey_nhl",
  mls: "soccer_usa_mls",
};

const normNick = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
// The Odds API returns full team names ("New York Mets"); Ticketmaster opponents
// arrive as nicknames ("Mets"). Key by both the full normalized name and the
// last word so a lookup by either form resolves.
const lastWordNick = (s) => { const w = String(s || "").trim().split(/\s+/); return normNick(w[w.length - 1]); };

// ET calendar date (YYYY-MM-DD → MM-DD), matching the rest of the app.
const etMonthDay = (iso) => {
  try { return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/New_York" }).slice(5); }
  catch { return null; }
};

// Pure: Odds API events JSON → Map<"nick|MM-DD", absoluteSpread>.
// Keyed by BOTH teams so a lookup by either side hits.
export function parseOdds(json) {
  const map = new Map();
  if (!Array.isArray(json)) return map;
  for (const ev of json) {
    const md = etMonthDay(ev.commence_time);
    if (!md) continue;
    // Find a spreads market from the first bookmaker that has one.
    let point = null;
    for (const bk of ev.bookmakers || []) {
      const m = (bk.markets || []).find((x) => x.key === "spreads");
      if (m && m.outcomes && m.outcomes.length) {
        const pts = m.outcomes.map((o) => Math.abs(o.point)).filter((n) => !isNaN(n));
        if (pts.length) { point = Math.max(...pts); break; } // both outcomes carry ±the same number
      }
    }
    if (point == null) continue;
    for (const nm of [ev.home_team, ev.away_team]) {
      const full = normNick(nm), nick = lastWordNick(nm);
      if (full) map.set(`${full}|${md}`, point);
      if (nick && nick !== full) map.set(`${nick}|${md}`, point);
    }
  }
  return map;
}

// Fetch a league's current spreads (empty map on any failure / no key).
export async function fetchSpreadMap(league) {
  const key = process.env.ODDS_API_KEY;
  const sport = SPORT_KEYS[(league || "").toLowerCase()];
  if (!key || !sport) return new Map();
  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${key}&regions=us&markets=spreads&oddsFormat=american`;
    const res = await fetch(url, { next: { revalidate: 21600 } }); // cache 6h — protects the 500/mo quota
    if (!res.ok) return new Map();
    return parseOdds(await res.json());
  } catch {
    return new Map();
  }
}

// Look up a game's spread by opponent nickname + MM-DD.
export function spreadFor(map, opp, ds) {
  if (!map || !map.size) return null;
  const v = map.get(`${normNick(opp)}|${ds}`);
  return v == null ? null : v;
}
