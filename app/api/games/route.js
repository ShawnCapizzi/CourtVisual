// CourtVisual — live games via Ticketmaster Discovery API.
// Server-side only: the API key lives in the TICKETMASTER_API_KEY env var and
// never reaches the browser. Responses cache for 5 minutes (rate-limit friendly).
//
// GET /api/games?name=Knicks&label=New%20York%20Knicks&city=New%20York&slug=knicks
// -> { games: [...], source: "ticketmaster" | "none", reason? }
//
// Factor scores for live games are v1 heuristics (event-name keywords + a small
// rivalry map). The race factor comes from live standings contention via the league context.

import { getLeagueContext } from "../../../lib/espn";
import { rivalryFactor, isTopRivalry, rivalryInfo } from "../../../lib/rivalries";
import { fetchBroadcastMap, networksFor } from "../../../lib/broadcasts";
import { fetchSpreadMap, spreadFor } from "../../../lib/odds";
import { matchupFromSpread, matchupFromRecords } from "../../../lib/data";

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

const LEAGUE_KW = { nba: "NBA", mlb: "MLB", nhl: "NHL", nfl: "NFL", wnba: "WNBA", mls: "MLS" };

// Strip playoff/qualifier noise so the opponent parses cleanly and the title reads like
// a matchup, not a ticketing SKU. Handles "Rd 4 Hm Gm 1", "Home Game 2", "Final TBD",
// "Winner of Round 3", parentheticals, "presented by", and dangling connectors.
function cleanEventName(name) {
  let s = name || "";
  s = s.split(/\s[-\u2013\u2014]\s/)[0];                                  // drop "- Game 5", "\u2013 If Necessary"
  s = s.replace(/\(.*?\)/g, " ");                                          // parentheticals
  s = s.replace(/\b(?:rd|round)\.?\s*\d+\b/gi, " ");                       // Rd 4, Round 4
  s = s.replace(/\b(?:hm|home|away|aw|road)?\s*g(?:a)?m(?:e)?\.?\s*\d+\b/gi, " "); // Hm Gm 1, Home Game 2, Gm 3
  s = s.replace(/\bgame\s*\d+\b/gi, " ");
  s = s.replace(/\bif necessary\b/gi, " ");
  s = s.replace(/\b(?:final|finals|series|conf(?:erence)?|division|wild ?card|round|winner|loser)\s+tbd\b/gi, " "); // "Final TBD"
  s = s.replace(/\bwinner of\b[^,]*/gi, " ");                              // "Winner of Round 3"
  s = s.replace(/\btbd\b/gi, " ");
  s = s.replace(/\b(nba finals|world series|stanley cup|finals?|playoffs?|postseason|first round|conference (?:semi)?finals?|division series|wild ?card|presented by[^,]*)\b/gi, " ");
  s = s.replace(/\b\d{4}\b/g, " ");
  s = s.replace(/\b(?:hm|aw)\b/gi, " ");                                   // stray home/away markers
  s = s.replace(/[:,]/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/^(?:vs\.?|v\.?|at|@)\s+/i, "").replace(/\s+(?:vs\.?|v\.?|at|@)$/i, ""); // dangling connectors
  return s.trim();
}
const slugify = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const lastWord = (s) => { const w = (s || "").trim().split(/\s+/); return w[w.length - 1] || s; };

// Non-game inventory must never enter the game ranking. A bar's "World Cup Watch
// Party" is real Ticketmaster inventory, but it isn't a match — and its name would
// otherwise steal a stakes floor from the keyword classifier below.
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const dowOf = (dt, localDate) => {
  try {
    if (dt) return DOW[new Date(dt).toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" })] ?? null;
    if (localDate) return DOW[new Date(localDate + "T17:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" })] ?? null;
  } catch {}
  return null;
};

const NON_GAME = /watch ?part(?:y|ies)|viewing part(?:y|ies)|fan ?fest|tailgate|happy hour|trivia|bingo|brunch|bar crawl|pub crawl|tribute|hospitality|vip (?:package|experience)|gameday experience|pregame part|postgame part|parking|season (?:ticket|membership|seat|plan)|full season|half season|partial (?:plan|season)|mini[- ]?plan|flex (?:plan|pack|membership)|\bpackage\b|\bsuite\b|premium seat|club seat|\bpsl\b|personal seat license|ticket package|group (?:ticket|outing)|\bdeposit\b|gift card|voucher|\bmembership\b|all[- ]?access|meet (?:and|&) greet/i;
const isNonGameEvent = (name) => NON_GAME.test(name || "");

function deriveFactors(eventName, oppName, teamSlug, startsAt) {
  const n = eventName.toLowerCase();
  const opp = oppName.toLowerCase();

  let playoff = 5;
  let historic = 5; // Matchup: neutral until priced by spread or records
  let tag = "Regular season";

  if (/\bgroup (?:stage|[a-h])\b/.test(n)) {
    // Tournament group matches are big, but they're not knockout games — no stakes floor.
    playoff = 7; historic = 6; tag = "Group stage";
  } else if (/world cup final|nba finals|world series|stanley cup final|super bowl|champions league final|grand final|cup final|\bchampionship\b/.test(n)) {
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
  const hot = 5; // THE RACE: neutral until standings contention is wired in below. Was a fake "stars" 7.

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

// Stable start instant for date logic. Real timestamps pass through; date-only events
// resolve to local noon (NOT midnight UTC, which shifted the game to the prior day and
// broke "Watch today"). No-date events stay null so they never claim to be "on today".
const isoStart = (dt, localDate) => dt || (localDate ? `${localDate}T12:00:00` : null);

function eventToGame(ev) {
  const cleaned = cleanEventName(ev.name || "");
  const dt = ev.dates?.start?.dateTime;
  const { date, ds } = fmtDate(dt, ev.dates?.start?.localDate);
  const venue = ev._embedded?.venues?.[0];
  const minP = ev.priceRanges?.[0]?.min;
  let matchup, opp, oppSlug, rA = "", rB = "";
  const sides = cleaned.split(/\s+(?:vs\.?|v\.?|at|@)\s+/i).map((p) => p.trim()).filter(Boolean);
  if (sides.length === 2 && sides[0].length <= 28 && sides[1].length <= 28) {
    matchup = `${sides[0]} vs ${sides[1]}`;
    opp = sides[1];
    oppSlug = slugify(matchup).slice(0, 48);
    rA = lastWord(sides[0]); rB = lastWord(sides[1]);
  } else if (sides.length === 1 && sides[0].length <= 30) {
    // One known side (e.g. an opponent still TBD). Show the real team, let the tag carry context.
    matchup = sides[0];
    opp = sides[0];
    oppSlug = slugify(sides[0]).slice(0, 48) || "event";
    rB = sides[0];
  } else {
    matchup = (cleaned || ev.name || "Event").slice(0, 44);
    opp = matchup;
    oppSlug = slugify(matchup).slice(0, 48) || "event";
    rB = opp;
  }
  const f = deriveFactors(ev.name || "", opp, "", dt);
  const genre = ev.classifications?.[0]?.genre?.name || null;
  return {
    matchup, opp, oppSlug, date, ds, iso: isoStart(dt, ev.dates?.start?.localDate), home: false, tag: f.tag, dow: dowOf(dt, ev.dates?.start?.localDate),
    sport: genre ? genre.toLowerCase() : null,
    playoff: f.playoff, rivalry: rivalryFactor(rA, rB), hot: f.hot, historic: f.historic,
    topRivals: isTopRivalry(rA, rB),
    rivalryName: (rivalryInfo(rA, rB) || {}).name || null,
    url: ev.url || null, minPrice: typeof minP === "number" ? Math.round(minP) : null, venue: venue?.name || null,
  };
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
  const sportFeed = (p.get("sportfeed") || "").trim(); // TM classification name, e.g. "Golf", "Boxing", "NBA"
  const weekend = p.get("weekend") === "1";
  const hot = p.get("hot") === "1";
  const lat = p.get("lat");
  const lng = p.get("lng");

  const key = process.env.TICKETMASTER_API_KEY;

  // Free-text search: any sport, league, series, or event ("World Cup", "Premier
  // League", "Yankees", "El Clasico"). Returns matchup cards, factors from the
  // event name (no team context, so no ESPN star-power enrichment here).
  if (sportFeed) {
    try {
      // Classification feed: every upcoming event in a sport/league, no keyword needed.
      // classificationName matches TM segment/genre/subGenre names ("Golf", "Boxing", "NBA").
      const nowISO = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
      const base = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${key}&sort=date,asc&size=199&startDateTime=${nowISO}`;
      const furl = `${base}&classificationName=${encodeURIComponent(sportFeed)}`;
      let fres = await fetch(furl, { next: { revalidate: 300 } });
      if (!fres.ok) return Response.json({ games: [], source: "none", reason: `tm_${fres.status}`, mode: "sportfeed" });
      let fdata = await fres.json();
      let fevents = fdata?._embedded?.events || [];
      // Fallback: some sports' classification string doesn't match TM's exact genre name
      // (e.g. "MMA" vs "Mixed Martial Arts"). Retry as a keyword so the chip never dead-ends.
      if (!fevents.length) {
        const kurl = `${base}&keyword=${encodeURIComponent(sportFeed)}&classificationName=Sports`;
        const kres = await fetch(kurl, { next: { revalidate: 300 } });
        if (kres.ok) { fdata = await kres.json(); fevents = fdata?._embedded?.events || []; }
      }
      const out = [];
      const fseen = new Set();
      for (const ev of fevents) {
        if (isNonGameEvent(ev.name)) continue;
        const g = eventToGame(ev);
        const keyd = `${g.oppSlug}-${g.ds}`;
        if (fseen.has(keyd)) continue;
        fseen.add(keyd);
        out.push(g);
      }
      return Response.json({ games: out, source: out.length ? "ticketmaster" : "none", mode: "sportfeed", sport: sportFeed });
    } catch {
      return Response.json({ games: [], source: "none", reason: "sportfeed_error", mode: "sportfeed" });
    }
  }

  if (q) {
    if (!key) return Response.json({ games: [], source: "none", reason: "no_key", query: q });
    try {
      const surl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${key}` +
        `&keyword=${encodeURIComponent(q)}&classificationName=Sports&sort=date,asc&size=199`;
      const sres = await fetch(surl, { next: { revalidate: 300 } });
      if (!sres.ok) return Response.json({ games: [], source: "none", reason: `tm_${sres.status}`, query: q });
      const sdata = await sres.json();
      const sevents = sdata?._embedded?.events || [];
      const out = [];
      const sseen = new Set();
      for (const ev of sevents) {
        if (isNonGameEvent(ev.name)) continue;
        const g = eventToGame(ev);
        const keyd = `${g.oppSlug}-${g.ds}`;
        if (sseen.has(keyd)) continue;
        sseen.add(keyd);
        out.push(g);
      }
      return Response.json({ games: out, source: out.length ? "ticketmaster" : "none", query: q });
    } catch {
      return Response.json({ games: [], source: "none", reason: "fetch_error", query: q });
    }
  }

  // Games this weekend near the device (geo) — Fri\u2013Sun sports events within range.
  if (weekend) {
    if (!key) return Response.json({ games: [], source: "none", reason: "no_key" });
    try {
      const now = new Date();
      const dow = now.getDay();
      const friOff = dow === 0 ? -2 : (5 - dow);
      const start = new Date(now); start.setDate(now.getDate() + friOff); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setDate(now.getDate() + friOff + 2); end.setHours(23, 59, 59, 0);
      const startISO = (start < now ? now : start).toISOString().split(".")[0] + "Z";
      const endISO = end.toISOString().split(".")[0] + "Z";
      let wurl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${key}&classificationName=Sports&sort=date,asc&size=40&startDateTime=${startISO}&endDateTime=${endISO}`;
      if (lat && lng) wurl += `&latlong=${lat},${lng}&radius=75&unit=miles`;
      const wres = await fetch(wurl, { next: { revalidate: 600 } });
      if (!wres.ok) return Response.json({ games: [], source: "none", reason: `tm_${wres.status}` });
      const wdata = await wres.json();
      const wevents = wdata?._embedded?.events || [];
      const out = [];
      const wseen = new Set();
      for (const ev of wevents) {
        if (isNonGameEvent(ev.name)) continue;
        const g = eventToGame(ev);
        const keyd = `${g.oppSlug}-${g.ds}`;
        if (wseen.has(keyd)) continue;
        wseen.add(keyd);
        out.push(g);
      }
      return Response.json({ games: out, source: out.length ? "ticketmaster" : "none", mode: "weekend", near: !!(lat && lng) });
    } catch {
      return Response.json({ games: [], source: "none", reason: "fetch_error" });
    }
  }

  // Hottest games of the season — broad upcoming sports, surfaced by relevance; the
  // client re-ranks by the fan's excitement weights. Also feeds the rivalry / stakes filters.
  if (hot) {
    if (!key) return Response.json({ games: [], source: "none", reason: "no_key" });
    try {
      const now = new Date();
      const startISO = now.toISOString().split(".")[0] + "Z";
      const endISO = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 120).toISOString().split(".")[0] + "Z";
      const hurl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${key}&classificationName=Sports&sort=relevance,desc&size=199&startDateTime=${startISO}&endDateTime=${endISO}`;
      const hres = await fetch(hurl, { next: { revalidate: 600 } });
      if (!hres.ok) return Response.json({ games: [], source: "none", reason: `tm_${hres.status}` });
      const hdata = await hres.json();
      const hev = hdata?._embedded?.events || [];
      const out = [];
      const hseen = new Set();
      for (const ev of hev) {
        if (isNonGameEvent(ev.name)) continue;
        const g = eventToGame(ev);
        const keyd = `${g.oppSlug}-${g.ds}`;
        if (hseen.has(keyd)) continue;
        hseen.add(keyd);
        out.push(g);
      }
      return Response.json({ games: out, source: out.length ? "ticketmaster" : "none", mode: "hot" });
    } catch {
      return Response.json({ games: [], source: "none", reason: "fetch_error" });
    }
  }

  if (!key) return Response.json({ games: [], source: "none", reason: "no_key" });
  if (!label) return Response.json({ games: [], source: "none", reason: "no_team" });

  // Only future games: a startDateTime floor at "now" keeps finished/past games out of the
  // upcoming schedule (e.g. a season that just ended). Cancelled-but-future games are caught
  // separately by status below.
  const nowISO = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const url =
    `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${key}` +
    `&keyword=${encodeURIComponent(label)}&classificationName=Sports&sort=date,asc&size=199&startDateTime=${nowISO}`; // TM max page ~200 — covers a full season in one fetch

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
      if (isNonGameEvent(evName)) continue;
      // Skip events TM has flagged cancelled/postponed — e.g. a playoff contingency game
      // (Finals Game 6/7) that won't be played once the series is clinched.
      const evStatus = ev.dates?.status?.code;
      if (evStatus === "cancelled" || evStatus === "canceled" || evStatus === "postponed") continue;
      const parts = cleanEventName(evName).split(/\s+(?:vs\.?|v\.?|at|@)\s+/i);
      if (parts.length !== 2) continue;

      const teamFirst = parts[0].toLowerCase().includes(name);
      const teamSecond = parts[1].toLowerCase().includes(name);
      if (!teamFirst && !teamSecond) continue;

      const oppFull = (teamFirst ? parts[1] : parts[0]).trim();
      const resolved = ctx?.resolveTeam(oppFull);
      const opp = resolved?.nick || lastWord(oppFull);
      const oppId = resolved?.id || null; // ESPN team id, for exact standings matching
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
        opp, oppSlug, oppId, date, ds, iso: isoStart(dt, ev.dates?.start?.localDate), home, dow: dowOf(dt, ev.dates?.start?.localDate),
        tag: f.tag,
        playoff: f.playoff, rivalry: f.rivalry, hot: f.hot, historic: f.historic,
        url: ev.url || null,
        minPrice: typeof minPrice === "number" ? Math.round(minPrice) : null,
        venue: venue?.name || null,
      };
      g.rivalry = rivalryFactor(name, opp);
      g.topRivals = isTopRivalry(name, opp);
      g.rivalryName = (rivalryInfo(name, opp) || {}).name || null;

      if (ctx) {
        // THE RACE = standings pressure on both sides. Contention now drives the `hot`
        // (race) factor directly, instead of quietly inflating Stakes as it used to. Stakes
        // stays about the game's round; the race is about what's on the line in the standings.
        const cMine = ctx.contention(label), cOpp = ctx.contention(opp);
        if (cMine != null && cOpp != null) g.hot = Math.max(g.hot, Math.round((cMine + cOpp) / 2));
        if (cMine != null) g.teamContention = cMine; // viewing team's contention, for the fan-lens "in the race" bump
        // Matchup from records: win-pct of both sides if the league context exposes it.
        const pMine = ctx.winPct ? ctx.winPct(label) : null, pOpp = ctx.winPct ? ctx.winPct(opp) : null;
        const mr = matchupFromRecords(pMine, pOpp, lastWord(label), opp);
        if (mr) { g.historic = mr.value; g.matchupWhy = mr.why; g.matchupKind = mr.kind; }
        // A national storyline still earns a tag, but no longer feeds a factor (stars are gone).
        if (ctx.storyline(label) || ctx.storyline(opp)) { if (g.tag === "Regular season") g.tag = "Storyline game"; }
      }

      games.push(g);
    }

    // Matchup, best signal: betting spread overrides records when available.
    try {
      const smap = await fetchSpreadMap(league);
      if (smap.size) for (const g of games) {
        const sp = spreadFor(smap, g.opp, g.ds);
        const ms = matchupFromSpread(sp, g.opp, lastWord(label));
        if (ms) { g.historic = ms.value; g.matchupWhy = ms.why; g.matchupKind = ms.kind; }
      }
    } catch {}

    // Exact national networks for imminent games (ESPN's scoreboard window covers
    // the current day/week). Misses are silent — the client falls back to the
    // league watch guide, never a guessed network.
    try {
      const bmap = await fetchBroadcastMap(league);
      if (bmap.size) for (const g of games) { const n = networksFor(bmap, g.opp, g.ds); if (n) g.networks = n; }
    } catch {}

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
              if (isNonGameEvent(ev.name)) continue;
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
              g.rivalryName = (rivalryInfo(n1, n2) || {}).name || null;
              if (ctx) {
                // THE RACE: contention drives the race factor (hot). Stars are gone.
                const c1 = ctx.contention(n1), c2 = ctx.contention(n2);
                if (c1 != null && c2 != null) g.hot = Math.max(g.hot, Math.round((c1 + c2) / 2));
                if (ctx.storyline(n1) || ctx.storyline(n2)) { if (g.tag === "Regular season") g.tag = "Storyline game"; }
              }
              leagueGames.push(g);
              if (leagueGames.length >= 14) break;
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
