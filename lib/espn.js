// CourtVisual — ESPN enrichment (server-only, used by /api/games).
//
// ESPN's undocumented JSON API is free and keyless but unofficial: shapes can
// change and aren't published. So EVERYTHING here is defensive — every parse is
// best-effort and any failure leaves the caller's heuristic factor untouched.
// Enrichment can only RAISE confidence, never break the slate.
//
// Per request we make at most 4 league-level calls (not per-game), heavily
// cached. Field names are written against ESPN's documented/observed shapes;
// verify against live responses via /api/games?...&debug=1.

const SPORT = { nba: ["basketball", "nba"], mlb: ["baseball", "mlb"], nhl: ["hockey", "nhl"], nfl: ["football", "nfl"] };

function seasonYear(league) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  if (league === "nba" || league === "nhl") return m >= 10 ? y : y - 1; // season spans year boundary
  return y; // mlb, nfl
}

const idFrom = (x) => {
  if (!x) return null;
  if (x.id != null) return String(x.id);
  const ref = x.$ref || (typeof x === "string" ? x : null);
  const m = ref && ref.match(/\/teams\/(\d+)/);
  return m ? m[1] : null;
};

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

async function getJSON(url, revalidate) {
  try {
    const r = await fetch(url, { next: { revalidate } });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

// Walk any nested standings structure; collect nodes that look like team entries.
function collectEntries(node, out, depth = 0) {
  if (!node || typeof node !== "object" || depth > 8) return;
  if (Array.isArray(node)) { for (const n of node) collectEntries(n, out, depth + 1); return; }
  if (node.team && node.stats) out.push(node);
  for (const k in node) if (k !== "team") collectEntries(node[k], out, depth + 1);
}

function parseTeams(json) {
  const byName = new Map();
  const metaById = new Map();
  try {
    const teams = json?.sports?.[0]?.leagues?.[0]?.teams || [];
    for (const t of teams) {
      const team = t.team || t;
      const id = team.id != null ? String(team.id) : null;
      if (!id) continue;
      // ESPN "name" is the nickname ("Spurs"); shortDisplayName is a good fallback
      metaById.set(id, { nick: team.name || team.shortDisplayName || team.nickname || team.displayName || null });
      for (const key of [team.displayName, team.name, team.shortDisplayName, team.location, team.abbreviation, team.nickname]) {
        if (key) byName.set(norm(key), id);
      }
    }
  } catch {}
  return { byName, metaById };
}

function parseStandings(json) {
  const byId = new Map();
  try {
    const entries = [];
    collectEntries(json, entries);
    for (const e of entries) {
      const id = idFrom(e.team);
      if (!id) continue;
      let wins = null, losses = null, pct = null, seed = null;
      for (const st of e.stats || []) {
        const n = (st.name || st.type || st.abbreviation || "").toLowerCase();
        const v = typeof st.value === "number" ? st.value : parseFloat(st.displayValue);
        if (n === "wins") wins = v;
        else if (n === "losses") losses = v;
        else if (n.includes("winpercent")) pct = v;
        else if (n.includes("playoffseed") || n === "seed") seed = v;
      }
      if (pct == null && wins != null && losses != null && wins + losses > 0) pct = wins / (wins + losses);
      byId.set(id, { pct, seed, wins, losses });
    }
  } catch {}
  return byId;
}

const STORY = /(record|milestone|retir|final season|farewell|hall of fame|history|historic|chase|chasing|no[- ]hitter|perfect game|streak|return|comeback|debut|clinch|elimination|\b\d{3}(th|rd|st|nd)\b|3,?000|500th|1,?000)/i;

function parseNews(json) {
  const ids = new Set();
  const names = [];
  try {
    for (const a of json?.articles || []) {
      const text = `${a.headline || ""} ${a.description || ""}`;
      if (!STORY.test(text)) continue;
      let tagged = false;
      for (const c of a.categories || []) {
        const tid = idFrom(c.team) || (c.teamId != null ? String(c.teamId) : null);
        if (tid) { ids.add(tid); tagged = true; }
      }
      if (!tagged) names.push(norm(text)); // fall back to text matching against team names
    }
  } catch {}
  return { ids, names };
}

function parseLeaders(json) {
  // teamId -> best rank index (0 = league leader) in a scoring-ish category
  const byId = new Map();
  try {
    const cats = json?.categories || json?.leaders?.categories || [];
    const pick = cats.find((c) => /point|scoring|homerun|home run|batting|ops|rbi|goals/i.test(c.name || c.displayName || "")) || cats[0];
    const leaders = pick?.leaders || [];
    leaders.forEach((ld, i) => {
      const tid = idFrom(ld.team);
      if (tid && !byId.has(tid)) byId.set(tid, i);
    });
  } catch {}
  return byId;
}

// scoring helpers
const starFromRank = (rank) => (rank == null ? null : rank <= 2 ? 10 : rank <= 5 ? 9 : rank <= 10 ? 8 : rank <= 25 ? 7 : 6);
const contendFromPct = (pct) => (pct == null ? null : Math.max(0, Math.min(10, Math.round(((pct - 0.30) / 0.45) * 10))));

export async function getLeagueContext(league) {
  const sp = SPORT[league];
  if (!sp) return null;
  const [sport, lg] = sp;
  const base = "https://site.api.espn.com/apis";
  const core = "https://sports.core.api.espn.com/v2";
  const year = seasonYear(league);

  const [teamsJson, standJson, newsJson, leadJson] = await Promise.all([
    getJSON(`${base}/site/v2/sports/${sport}/${lg}/teams`, 86400),
    getJSON(`${base}/v2/sports/${sport}/${lg}/standings`, 1800),
    getJSON(`${base}/site/v2/sports/${sport}/${lg}/news`, 1800),
    getJSON(`${core}/sports/${sport}/leagues/${lg}/seasons/${year}/types/2/leaders?limit=50`, 1800),
  ]);

  const { byName: teamIdByName, metaById } = parseTeams(teamsJson);
  const standing = parseStandings(standJson);
  const news = parseNews(newsJson);
  const stars = parseLeaders(leadJson);

  const matchId = (name) => {
    const n = norm(name);
    if (!n) return null;
    if (teamIdByName.has(n)) return teamIdByName.get(n);
    for (const [k, id] of teamIdByName) if (k.includes(n) || n.includes(k)) return id;
    return null;
  };

  return {
    resolveTeam(name) { const id = matchId(name); if (!id) return null; return { id, nick: metaById.get(id)?.nick || null }; },
    star(name) { const id = matchId(name); return id ? starFromRank(stars.get(id)) : null; },
    contention(name) { const id = matchId(name); return id ? contendFromPct(standing.get(id)?.pct) : null; },
    storyline(name) {
      const id = matchId(name);
      if (id && news.ids.has(id)) return true;
      const n = norm(name);
      return news.names.some((t) => n && t.includes(n));
    },
    _debug: { teams: teamIdByName.size, standings: standing.size, newsTeams: news.ids.size, newsText: news.names.length, leaders: stars.size, year },
  };
}
