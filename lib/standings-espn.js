// CourtVisual — ESPN standings -> normalized context. The source-adapter implementation.
// Built and verified against a real ESPN payload. Provider-specific parsing lives HERE so
// lib/context.js stays provider-independent; swap this one file to change providers later.
// Reads only what ESPN actually returns and leaves the rest null, so the formatter stays
// silent rather than inventing. No star power, no player data.

const num = (v) => {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") { const n = Number(v.replace(/[^0-9.\-]/g, "")); return isFinite(n) ? n : null; }
  return null;
};

// Index a row's stats by every key ESPN exposes (name, type, abbreviation, displayName).
function statMap(entry) {
  const out = {};
  for (const s of entry?.stats || []) {
    for (const k of [s.name, s.type, s.abbreviation, s.displayName]) if (k) out[String(k).toLowerCase()] = s;
  }
  return out;
}
const val = (m, keys) => { for (const k of keys) { const s = m[k.toLowerCase()]; const n = num(s?.value ?? s?.displayValue); if (n != null) return n; } return null; };
const disp = (m, keys) => { for (const k of keys) { const s = m[k.toLowerCase()]; if (s?.displayValue) return s.displayValue; } return null; };

// Prefer ESPN's official position note over computing cutlines. Map its wording to a token.
export function statusFromNote(note) {
  const d = (note?.description || "").toLowerCase();
  if (!d) return null;
  if (d.includes("eliminat")) return "eliminated";
  if (d.includes("clinch")) return "clinched";
  if (d.includes("wild card") || d.includes("wild-card")) return "wildcard";
  if (d.includes("play-in") || d.includes("play in")) return "playin";
  if (d.includes("playoff") || d.includes("qualif")) return "in";
  return null;
}

// Some sports (NFL) carry no note but a single-letter `clincher` stat instead.
// e = eliminated; x = clinched a berth; y/z/* = clinched division/bye/top seed.
function statusFromClincher(cl) {
  const c = (cl || "").toLowerCase().trim();
  if (c === "e") return "eliminated";
  if (c === "x") return "in";
  if (c === "y" || c === "z" || c === "*") return "clinched";
  return null;
}

// Is the standings group a division or a conference for this sport, and the early-season
// games threshold (the doc's "hide noisy early-season" guidance).
const SHAPE = {
  baseball:   { kind: "division",   early: 40 },
  hockey:     { kind: "division",   early: 20 },
  basketball: { kind: "conference", early: 20 },
  football:   { kind: "division",   early: 6 },
  soccer:     { kind: "conference", early: 8 },
};
// Per-league overrides where the league's structure differs from its sport's default.
// WNBA has no conference children: its table is a single league-wide ladder at the root.
const SHAPE_BY_LEAGUE = { wnba: { kind: "league" } };
const EARLY_BY_LEAGUE = { wnba: 10 };

// Collect every node that actually holds a standings table, carrying the grouping
// name AND abbreviation above it (so we get both "American Football Conference" and "AFC").
function walkGroups(node, acc, parent = null) {
  if (!node || typeof node !== "object") return;
  const entries = node.standings?.entries;
  if (entries && entries.length) acc.push({ groupName: node.name, groupAbbr: node.abbreviation, parent: parent?.name || null, parentAbbr: parent?.abbr || null, entries });
  const nextParent = node.name && node.children ? { name: node.name, abbr: node.abbreviation } : parent;
  for (const c of node.children || []) walkGroups(c, acc, nextParent);
}

export function normalizeEspnStandings(payload, sport, league) {
  const season = payload?.season?.year ?? payload?.season ?? null;
  const startMs = payload?.season?.startDate ? Date.parse(payload.season.startDate) : null;
  // If the season hasn't started yet, ESPN returns LAST season's final table under the new
  // season label. Flag it stale so we never present it as the current standing.
  const seasonStarted = startMs == null ? true : Date.now() >= startMs;
  const asOf = new Date().toISOString();
  const shape = SHAPE[sport] || { kind: "conference", early: 0 };
  const kind = (SHAPE_BY_LEAGUE[league] || {}).kind || shape.kind;
  const earlyThresh = EARLY_BY_LEAGUE[league] ?? shape.early;
  const groups = [];
  walkGroups(payload, groups);
  const out = [];
  for (const g of groups) {
    g.entries.forEach((e, i) => {
      const m = statMap(e);
      // Rank within the displayed group is the row order (ESPN returns them sorted) or an
      // explicit `rank` field. NEVER playoffSeed: in MLB that's a league-wide seed, not a
      // division position, which would print "8th" in a 5-team division.
      const rank = val(m, ["rank"]) ?? (i + 1);
      let gp = val(m, ["gamesplayed", "gp"]);
      const wins = val(m, ["wins", "w"]);
      const losses = val(m, ["losses", "l"]);
      const ties = val(m, ["ties", "tiegames", "draws", "d", "otlosses"]);
      if (gp == null && wins != null && losses != null) gp = wins + losses + (ties || 0);
      const c = {
        provider: "espn", sport, league, season, asOf, source: "espn",
        teamId: e.team?.id ? String(e.team.id) : null,
        teamName: e.team?.displayName || e.team?.name || null,
        abbr: e.team?.abbreviation || null,
        wins, losses, ties,
        points: val(m, ["points", "p", "pts"]),
        winPct: val(m, ["winpercent", "pct"]),
        gamesPlayed: gp,
        goalDiff: val(m, ["pointdifferential", "differential", "gd"]),
        record: disp(m, ["overall", "total"]),
        gamesBack: val(m, ["gamesbehind", "gb"]),
        divisionGamesBack: val(m, ["divisiongamesbehind"]),
        wildCardGamesBack: val(m, ["wildcardgamesbehind", "wcgb"]),
        playoffSeed: val(m, ["playoffseed"]),
        playoffNote: e.note?.description || null,
        playoffColor: e.note?.color || null,
        playoffStatus: statusFromNote(e.note) || statusFromClincher(disp(m, ["clincher"])),
        stale: !seasonStarted,
        early: seasonStarted && earlyThresh > 0 && gp != null && gp < earlyThresh,
        confidence: 0.9,
      };
      if (kind === "conference") { c.conference = g.groupName; c.conferenceAbbr = g.groupAbbr; c.conferenceRank = rank; }
      else if (kind === "league") { c.leagueRank = rank; c.playoffSeed = c.playoffSeed ?? rank; }
      else { c.division = g.groupName; c.divisionAbbr = g.groupAbbr; c.divisionRank = rank; c.conference = g.parent || null; c.conferenceAbbr = g.parentAbbr || null; }
      out.push(c);
    });
  }
  return out;
}

// Persistence shape: a normalized context + its rendered line -> a flat snake_case row
// matching the team_standings table. Kept here so the table stays one source of truth.
export function standingRow(c, line) {
  return {
    league: c.league, sport: c.sport,
    season: c.season != null ? String(c.season) : null,
    team_id: c.teamId, team_name: c.teamName, abbr: c.abbr,
    conference: c.conference ?? null, conference_abbr: c.conferenceAbbr ?? null, conference_rank: c.conferenceRank ?? null,
    division: c.division ?? null, division_abbr: c.divisionAbbr ?? null, division_rank: c.divisionRank ?? null,
    league_rank: c.leagueRank ?? null, playoff_seed: c.playoffSeed ?? null,
    wins: c.wins ?? null, losses: c.losses ?? null, ties: c.ties ?? null,
    points: c.points ?? null, win_pct: c.winPct ?? null, games_played: c.gamesPlayed ?? null,
    goal_diff: c.goalDiff ?? null, record: c.record ?? null,
    games_back: c.gamesBack ?? null, division_games_back: c.divisionGamesBack ?? null, wild_card_games_back: c.wildCardGamesBack ?? null,
    playoff_status: c.playoffStatus ?? null, playoff_note: c.playoffNote ?? null, playoff_color: c.playoffColor ?? null,
    stale: !!c.stale, early: !!c.early, confidence: c.confidence ?? null,
    context_line: line || null,
    as_of: c.asOf || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
