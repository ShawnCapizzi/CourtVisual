// CourtVisual broadcasts v1 — per-game national network names from ESPN's public
// scoreboard feed. Scope is deliberately honest: the scoreboard covers the current
// day/week, so imminent games get exact networks ("Tonight on TNT") and everything
// else falls back to the league guide in lib/watch.js. No blackout guessing.
//
// parseScoreboard is pure and fixture-tested; fetchBroadcastMap is the I/O wrapper.

const ESPN_PATHS = {
  nfl: "football/nfl",
  nba: "basketball/nba",
  mlb: "baseball/mlb",
  nhl: "hockey/nhl",
  mls: "soccer/usa.1",
  wnba: "basketball/wnba",
};

const normNick = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

// Game dates in the app (ds) are venue-local "MM-DD" from Ticketmaster; ESPN event
// dates are UTC ISO. Normalize ESPN to US/Eastern calendar date — close enough that
// a mismatch only means "no exact network", never a wrong one.
const etMonthDay = (iso) => {
  try {
    const parts = new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD
    return parts.slice(5); // MM-DD
  } catch {
    return null;
  }
};

// Pure parser: ESPN scoreboard JSON → Map<"nickname|MM-DD", string[] networks>
export function parseScoreboard(json) {
  const map = new Map();
  const events = json?.events || [];
  for (const ev of events) {
    const comp = ev?.competitions?.[0];
    if (!comp) continue;
    const md = etMonthDay(ev.date || comp.date);
    if (!md) continue;
    const names = [];
    for (const b of comp.broadcasts || []) for (const n of b.names || []) if (n && !names.includes(n)) names.push(n);
    if (!names.length) continue;
    for (const c of comp.competitors || []) {
      const nick = normNick(c?.team?.shortDisplayName || c?.team?.name);
      if (nick) map.set(`${nick}|${md}`, names);
    }
  }
  return map;
}

// Fetch this league's current scoreboard and return the broadcast map (empty on any failure).
export async function fetchBroadcastMap(league) {
  const path = ESPN_PATHS[(league || "").toLowerCase()];
  if (!path) return new Map();
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`, { next: { revalidate: 600 } });
    if (!res.ok) return new Map();
    return parseScoreboard(await res.json());
  } catch {
    return new Map();
  }
}

// Look up exact networks for a game by opponent nickname + MM-DD.
export function networksFor(map, opp, ds) {
  if (!map || !map.size) return null;
  return map.get(`${normNick(opp)}|${ds}`) || null;
}
