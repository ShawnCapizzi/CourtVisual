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
import { rivalryFactor, isTopRivalry } from "../../../lib/rivalries";

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

const LEAGUE_KW = { nba: "NBA", mlb: "MLB", nhl: "NHL", nfl: "NFL" };

// Strip playoff/qualifier noise so the opponent parses cleanly.
function cleanEventName(name) {
  let s = name || "";
  s = s.split(/\s[-\u2013\u2014]\s/)[0];          // drop "- Game 5", "\u2013 If Necessary"
  s = s.replace(/\(.*?\)/g, " ");                    // parentheticals
  s = s.replace(/\bgame\s*\d+\b/gi, " ");
  s = s.replace(/\bif necessary\b/gi, " ");
  s = s.replace(/\b(nba finals|world series|stanley cup|finals|playoffs?|postseason|first round|conference (?:semi)?finals?|division series|wild ?card|presented by[^,]*)\b/gi, " ");
  s = s.replace(/\b\d{4}\b/g, " ");
  return s.replace(/[:,]/g, " ").replace(/\s+/g, " ").trim();
}
const slugify = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const lastWord = (s) => { const w = (s || "").trim().split(/\s+/); return w[w.length - 1] || s; };

function deriveFactors(eventName, oppName, teamSlug, startsAt) {
  const n = eventName.toLowerCase();
  const opp = oppName.toLowerCase();

  let playoff = 5;
  let historic = 4;
  let tag = "Regular season";

  if (/world cup final|nba finals|world series|stanley cup final|super bowl|champions league final|grand final|cup final|\bchampionship\b/.test(n)) {
    playoff = 10; historic = 10; tag = "Championship";
  } else if (/world cup|conference finals|league championship|semifinals?|quarterfinals?|round of 16|knockout/.test(n)) {
    playoff = 9; historic = 8; tag = "Knockout stage";
  } else if (/playoff|postseason|first round|wild card|clinch/.test(n)) {
    playoff = 9; historic = 7; tag = "Playoffs";
  } else if (/opening|home opener|season opener/.test(n)) {
    historic = 8; tag = "Season Opener";
  } else if (startsAt) {
    const day = new Date(startsAt).getUTCDay();
    if (day === 0 || day === 5 || day === 6) tag = "Weekend Game";
  }

  const rivals = RIVALS[teamSlug] || [];
  const rivalry = (rivals.some((r) => opp.includes(r)) || /derby|clasico|rivalry|el clasico/.test(n)) ? 9 : 5;
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
  const q = (p.get("q") || "").trim();

  const key = process.env.TICKETMASTER_API_KEY;

  // Free-text search: any sport, league, series, or event ("World Cup", "Premier
  // League", "Yankees", "El Clasico"). Returns matchup cards, factors from the
  // event name (no team context, so no ESPN star-power enrichment here).
  if (q) {
    if (!key) return Response.json({ games: [], source: "none", reason: "no_key", query: q });
    try {
      const surl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${key}` +
        `&keyword=${encodeURIComponent(q)}&classificationName=Sports&sort=date,asc&size=24`;
      const sres = await fetch(surl, { next: { revalidate: 300 } });
      if (!sres.ok) return Response.json({ games: [], source: "none", reason: `tm_${sres.status}`, query: q });
      const sdata = await sres.json();
      const sevents = sdata?._embedded?.events || [];
      const out = [];
      const sseen = new Set();
      for (const ev of sevents) {
        const cleaned = cleanEventName(ev.name || "");
        const parts = cleaned.split(/\s+(?:vs\.?|v\.?|at|@)\s+/i);
        const dt = ev.dates?.start?.dateTime;
        const { date, ds } = fmtDate(dt, ev.dates?.start?.localDate);
        const venue = ev._embedded?.venues?.[0];
        const minP = ev.priceRanges?.[0]?.min;
        let matchup, opp, oppSlug;
        if (parts.length === 2 && parts[0].trim().length <= 28 && parts[1].trim().length <= 28) {
          matchup = `${parts[0].trim()} vs ${parts[1].trim()}`;
          opp = parts[1].trim();
          oppSlug = slugify(matchup).slice(0, 48);
        } else {
          matchup = (cleaned || ev.name || "Event").slice(0, 44);
          opp = matchup;
          oppSlug = slugify(matchup).slice(0, 48) || `ev-${out.length}`;
        }
        const keyd = `${oppSlug}-${ds}`;
        if (sseen.has(keyd)) continue;
        sseen.add(keyd);
        const f = deriveFactors(ev.name || "", opp, "", dt);
        const rA = parts.length === 2 ? lastWord(parts[0]) : "";
        const rB = parts.length === 2 ? lastWord(parts[1]) : opp;
        out.push({
          matchup, opp, oppSlug, date, ds, home: false, tag: f.tag,
          playoff: f.playoff, rivalry: rivalryFactor(rA, rB), hot: f.hot, historic: f.historic,
          topRivals: isTopRivalry(rA, rB),
          url: ev.url || null, minPrice: typeof minP === "number" ? Math.round(minP) : null, venue: venue?.name || null,
        });
        if (out.length >= 8) break;
      }
      return Response.json({ games: out, source: out.length ? "ticketmaster" : "none", query: q });
    } catch {
      return Response.json({ games: [], source: "none", reason: "fetch_error", query: q });
    }
  }

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

    let ctx = null;
    try { ctx = await getLeagueContext(league); } catch {}

    const games = [];
    const seen = new Set();

    for (const ev of events) {
      const evName = ev.name || "";
      const parts = cleanEventName(evName).split(/\s+(?:vs\.?|v\.?|at|@)\s+/i);
      if (parts.length !== 2) continue;

      const teamFirst = parts[0].toLowerCase().includes(name);
      const teamSecond = parts[1].toLowerCase().includes(name);
      if (!teamFirst && !teamSecond) continue;

      const oppFull = (teamFirst ? parts[1] : parts[0]).trim();
      const resolved = ctx?.resolveTeam(oppFull);
      const opp = resolved?.nick || lastWord(oppFull);
      const oppSlug = slugify(opp);
      if (!opp || /^\d+$/.test(opp)) continue; // guard against junk like "5"

      const dt = ev.dates?.start?.dateTime;
      const { date, ds } = fmtDate(dt, ev.dates?.start?.localDate);
      const dedupe = `${oppSlug}-${ds}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);

      const venue = ev._embedded?.venues?.[0];
      const venueCity = (venue?.city?.name || "").toLowerCase();
      const home = venueCity ? venueCity === city : teamFirst;

      const f = deriveFactors(evName, opp, slug, dt);
      const minPrice = ev.priceRanges?.[0]?.min;

      const g = {
        opp, oppSlug, date, ds, home,
        tag: f.tag,
        playoff: f.playoff, rivalry: f.rivalry, hot: f.hot, historic: f.historic,
        url: ev.url || null,
        minPrice: typeof minPrice === "number" ? Math.round(minPrice) : null,
        venue: venue?.name || null,
      };
      g.rivalry = rivalryFactor(name, opp);
      g.topRivals = isTopRivalry(name, opp);

      if (ctx) {
        const sMine = ctx.star(label), sOpp = ctx.star(opp);
        if (sMine != null || sOpp != null) g.hot = Math.max(g.hot, Math.round((sMine || 0) * 0.55 + (sOpp || 0) * 0.45) || g.hot);
        const cMine = ctx.contention(label), cOpp = ctx.contention(opp);
        if (cMine != null && cOpp != null) g.playoff = Math.max(g.playoff, Math.round((cMine + cOpp) / 2));
        if (ctx.storyline(label) || ctx.storyline(opp)) { g.historic = Math.max(g.historic, 9); if (g.tag === "Regular season") g.tag = "Storyline game"; }
      }

      games.push(g);
      if (games.length >= 6) break;
    }

    const teamRecord = ctx?.record(label) || null;
    let leagueGames = [];
    let mode = games.length ? "team" : "offseason";

    // No team games? See whether the league itself is live (postseason in progress).
    if (!games.length && key) {
      try {
        const kw = LEAGUE_KW[league];
        if (kw) {
          const lurl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${key}` +
            `&keyword=${encodeURIComponent(kw)}&classificationName=Sports&sort=date,asc&size=24`;
          const lres = await fetch(lurl, { next: { revalidate: 600 } });
          if (lres.ok) {
            const ldata = await lres.json();
            const levents = ldata?._embedded?.events || [];
            const lseen = new Set();
            for (const ev of levents) {
              const parts = cleanEventName(ev.name || "").split(/\s+(?:vs\.?|v\.?|at|@)\s+/i);
              if (parts.length !== 2) continue;
              const r1 = ctx?.resolveTeam(parts[0]); const n1 = r1?.nick || lastWord(parts[0]);
              const r2 = ctx?.resolveTeam(parts[1]); const n2 = r2?.nick || lastWord(parts[1]);
              if (!n1 || !n2 || /^\d+$/.test(n1) || /^\d+$/.test(n2) || n1 === n2) continue;
              const dt = ev.dates?.start?.dateTime;
              const { date, ds } = fmtDate(dt, ev.dates?.start?.localDate);
              const keyd = `${slugify(n1)}-${slugify(n2)}-${ds}`;
              if (lseen.has(keyd)) continue;
              lseen.add(keyd);
              const f = deriveFactors(ev.name || "", n2, "", dt);
              const venue = ev._embedded?.venues?.[0];
              const minP = ev.priceRanges?.[0]?.min;
              const g = {
                matchup: `${n1} vs ${n2}`, opp: n2, oppSlug: slugify(`${n1}-vs-${n2}`),
                date, ds, home: false, tag: f.tag,
                playoff: f.playoff, rivalry: rivalryFactor(n1, n2), hot: f.hot, historic: f.historic,
                url: ev.url || null, minPrice: typeof minP === "number" ? Math.round(minP) : null, venue: venue?.name || null,
              };
              g.topRivals = isTopRivalry(n1, n2);
              if (ctx) {
                const s1 = ctx.star(n1), s2 = ctx.star(n2);
                const ss = [s1, s2].filter((x) => x != null);
                if (ss.length) g.hot = Math.max(g.hot, Math.round(ss.reduce((a, b) => a + b, 0) / ss.length));
                const c1 = ctx.contention(n1), c2 = ctx.contention(n2);
                if (c1 != null && c2 != null) g.playoff = Math.max(g.playoff, Math.round((c1 + c2) / 2));
                if (ctx.storyline(n1) || ctx.storyline(n2)) { g.historic = Math.max(g.historic, 9); if (g.tag === "Regular season") g.tag = "Storyline game"; }
              }
              leagueGames.push(g);
              if (leagueGames.length >= 6) break;
            }
          }
        }
      } catch {}
      mode = leagueGames.length ? "league" : "offseason";
    }

    const body = { games, leagueGames, mode, teamRecord, source: games.length ? "ticketmaster" : "none" };
    if (debug) body.enrich = ctx?._debug || { note: "no espn context (league missing or all calls failed)" };
    return Response.json(body);
  } catch (e) {
    return Response.json({ games: [], source: "none", reason: "fetch_error" });
  }
}
