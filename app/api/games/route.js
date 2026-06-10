// CourtVisual — live games via Ticketmaster Discovery API.
// Server-side only: the API key lives in the TICKETMASTER_API_KEY env var and
// never reaches the browser. Responses cache for 5 minutes (rate-limit friendly).
//
// GET /api/games?name=Knicks&label=New%20York%20Knicks&city=New%20York&slug=knicks
// -> { games: [...], source: "ticketmaster" | "none", reason? }
//
// Factor scores for live games are v1 heuristics (event-name keywords + a small
// rivalry map). Star power is a baseline until a stats feed is wired in.

import { getLeagueContext } from "../../../lib/espn";

export const revalidate = 300;

const RIVALS = {
  knicks: ["celtics", "heat", "pacers", "nets", "bulls", "spurs"],
  lakers: ["celtics", "clippers", "warriors"],
  celtics: ["lakers", "knicks", "76ers", "heat"],
  warriors: ["cavaliers", "lakers", "kings"],
  bulls: ["pistons", "knicks", "cavaliers"],
  heat: ["knicks", "celtics", "pacers"],
  suns: ["spurs", "lakers", "mavericks"],
  spurs: ["suns", "mavericks", "knicks"],
  bucks: ["celtics", "heat", "bulls"],
  nuggets: ["lakers", "timberwolves", "jazz"],
  mets: ["yankees", "braves", "phillies", "nationals"],
  yankees: ["red sox", "mets", "rays", "orioles"],
  braves: ["mets", "phillies", "nationals"],
  phillies: ["mets", "braves", "nationals"],
  dodgers: ["giants", "padres", "yankees"],
  "red-sox": ["yankees", "rays", "blue jays"],
  cubs: ["cardinals", "white sox", "brewers"],
  padres: ["dodgers", "giants"],
};

function deriveFactors(eventName, oppName, teamSlug, startsAt) {
  const n = eventName.toLowerCase();
  const opp = oppName.toLowerCase();

  let playoff = 5;
  let historic = 4;
  let tag = "Regular season";

  if (/nba finals|world series|stanley cup|super bowl|championship/.test(n)) {
    playoff = 10; historic = 10; tag = "Championship";
  } else if (/conference finals|league championship/.test(n)) {
    playoff = 10; historic = 9; tag = "Conference Finals";
  } else if (/playoff|postseason|first round|semifinals|wild card/.test(n)) {
    playoff = 9; historic = 7; tag = "Playoffs";
  } else if (/opening|home opener/.test(n)) {
    historic = 8; tag = "Home Opener";
  } else if (startsAt) {
    const day = new Date(startsAt).getUTCDay();
    if (day === 0 || day === 5 || day === 6) tag = "Weekend Game";
  }

  const rivals = RIVALS[teamSlug] || [];
  const rivalry = rivals.some((r) => opp.includes(r)) ? 9 : 5;
  const hot = 7; // baseline until a live stats feed is wired

  return { playoff, rivalry, hot, historic, tag };
}

function fmtDate(dt, localDate) {
  try {
    if (dt) {
      const d = new Date(dt);
      const day = d.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" });
      const time = d.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
      const ds = d.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "2-digit", day: "2-digit" }).replace("/", "-");
      return { date: `${day} · ${time}`, ds };
    }
    if (localDate) {
      const [y, m, d] = localDate.split("-");
      const day = new Date(Date.UTC(+y, +m - 1, +d)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      return { date: day, ds: `${m}-${d}` };
    }
  } catch {}
  return { date: "TBD", ds: "tbd" };
}

export async function GET(request) {
  const p = new URL(request.url).searchParams;
  const label = p.get("label") || "";   // "New York Knicks"
  const name = (p.get("name") || "").toLowerCase();   // "knicks"
  const city = (p.get("city") || "").toLowerCase();   // "new york"
  const slug = p.get("slug") || "";
  const league = p.get("league") || "";
  const debug = p.get("debug") === "1";

  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) return Response.json({ games: [], source: "none", reason: "no_key" });
  if (!label) return Response.json({ games: [], source: "none", reason: "no_team" });

  const url =
    `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${key}` +
    `&keyword=${encodeURIComponent(label)}&classificationName=Sports&sort=date,asc&size=16`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return Response.json({ games: [], source: "none", reason: `tm_${res.status}` });
    const data = await res.json();
    const events = data?._embedded?.events || [];

    const games = [];
    const seen = new Set();

    for (const ev of events) {
      const evName = ev.name || "";
      const parts = evName.split(/\s+(?:vs\.?|v\.?|at)\s+/i);
      if (parts.length !== 2) continue;

      const teamFirst = parts[0].toLowerCase().includes(name);
      const teamSecond = parts[1].toLowerCase().includes(name);
      if (!teamFirst && !teamSecond) continue;

      const oppFull = (teamFirst ? parts[1] : parts[0]).trim();
      const oppWords = oppFull.split(/\s+/);
      const opp = oppWords[oppWords.length - 1];
      const oppSlug = opp.toLowerCase().replace(/[^a-z0-9]/g, "");

      const dt = ev.dates?.start?.dateTime;
      const { date, ds } = fmtDate(dt, ev.dates?.start?.localDate);
      const dedupe = `${oppSlug}-${ds}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);

      const venue = ev._embedded?.venues?.[0];
      const venueCity = (venue?.city?.name || "").toLowerCase();
      const home = venueCity ? venueCity === city : teamFirst;

      const f = deriveFactors(evName, oppFull, slug, dt);
      const minPrice = ev.priceRanges?.[0]?.min;

      games.push({
        opp, oppSlug, date, ds, home,
        tag: f.tag,
        playoff: f.playoff, rivalry: f.rivalry, hot: f.hot, historic: f.historic,
        url: ev.url || null,
        minPrice: typeof minPrice === "number" ? Math.round(minPrice) : null,
        venue: venue?.name || null,
      });
      if (games.length >= 6) break;
    }

    // ESPN enrichment — raises star power / playoff stakes / historic weight
    // from live data when available; silently no-ops on any failure.
    let enriched = null;
    try {
      const ctx = await getLeagueContext(league);
      if (ctx) {
        enriched = ctx._debug;
        for (const g of games) {
          const sMine = ctx.star(label);
          const sOpp = ctx.star(g.opp);
          if (sMine != null || sOpp != null) {
            g.hot = Math.max(g.hot, Math.round((sMine || 0) * 0.55 + (sOpp || 0) * 0.45) || g.hot);
          }
          const cMine = ctx.contention(label);
          const cOpp = ctx.contention(g.opp);
          if (cMine != null && cOpp != null) {
            g.playoff = Math.max(g.playoff, Math.round((cMine + cOpp) / 2));
          }
          if (ctx.storyline(label) || ctx.storyline(g.opp)) {
            g.historic = Math.max(g.historic, 9);
            if (g.tag === "Regular season") g.tag = "Storyline game";
          }
        }
      }
    } catch {}

    const body = { games, source: games.length ? "ticketmaster" : "none" };
    if (debug) body.enrich = enriched || { note: "no espn context (league missing or all calls failed)" };
    return Response.json(body);
  } catch (e) {
    return Response.json({ games: [], source: "none", reason: "fetch_error" });
  }
}
