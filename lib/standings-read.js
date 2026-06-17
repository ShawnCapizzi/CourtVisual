// CourtVisual — standings read/match helpers (pure, no network).
// The cron writes team_standings; /api/standings serves a league's rows; this module
// matches a game's teams to those rows and hands back the context line. Matching is
// league-scoped, so a normalized name with a nick fallback is reliable (nicks are unique
// within a league). ESPN team_id is used first when present.

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

// Generic words shared across many club names; dropping them keeps token overlap meaningful.
const STOP = new Set(["fc", "sc", "cf", "afc", "club", "united", "city", "new", "england",
  "real", "sporting", "inter", "los", "angeles", "san", "st", "saint", "de"]);
const tokset = (s) => new Set(
  (s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean)
    .map((w) => w.replace(/s$/, "")).filter((w) => !STOP.has(w) && w.length > 1)
);
const jaccard = (a, b) => {
  let i = 0; for (const x of a) if (b.has(x)) i++;
  const u = new Set([...a, ...b]).size; return u ? i / u : 0;
};

// Irreducible mismatches where ESPN shares no token with the catalog name.
// key = normalized catalog name, value = ESPN abbr (normalized).
const ALIASES = { losangelesfc: "lafc" };

export function indexStandings(rows) {
  const byId = new Map(), byName = new Map(), byAbbr = new Map();
  for (const r of rows || []) {
    if (r.team_id != null) byId.set(String(r.team_id), r);
    if (r.team_name) byName.set(norm(r.team_name), r);
    if (r.abbr) byAbbr.set(norm(r.abbr), r);
  }
  return { byId, byName, byAbbr, rows: rows || [] };
}

// Resolve one team to its standings row using whatever identity we have.
export function findStanding(idx, ident = {}) {
  if (!idx) return null;
  const { teamId, name, label, abbr } = ident;
  if (teamId != null && idx.byId.has(String(teamId))) return idx.byId.get(String(teamId));
  for (const cand of [label, name]) if (cand && idx.byName.has(norm(cand))) return idx.byName.get(norm(cand));
  if (abbr && idx.byAbbr.has(norm(abbr))) return idx.byAbbr.get(norm(abbr));
  // Explicit aliases for irreducible naming mismatches (e.g. "Los Angeles FC" -> LAFC).
  for (const cand of [label, name]) {
    const a = cand && ALIASES[norm(cand)];
    if (a && idx.byAbbr.has(a)) return idx.byAbbr.get(a);
  }
  // Fallback: the catalog nick vs the full team_name ("Mets" inside "New York Mets").
  const nick = norm(name || label || "");
  if (nick) {
    for (const r of idx.rows) {
      const tn = norm(r.team_name);
      if (tn && (tn.endsWith(nick) || nick.endsWith(tn))) return r;
    }
  }
  // Token overlap: handles word reorder ("New York Red Bulls" vs "Red Bull New York").
  const ct = tokset(label || name || "");
  if (ct.size) {
    let best = null, bs = 0;
    for (const r of idx.rows) {
      const s = jaccard(ct, tokset(r.team_name));
      if (s > bs) { bs = s; best = r; }
    }
    if (best && bs >= 0.5) return best;
  }
  return null;
}

export function lineFor(idx, ident) {
  return findStanding(idx, ident)?.context_line || null;
}

// Lens-aware pick for a matchup. Fan view speaks the followed side; neutral speaks the more
// notable side (better seed/rank), so the why-line always has a clear, honest subject.
export function standingForMatchup(idx, homeIdent, awayIdent, { lens = "neutral", followed = null } = {}) {
  const home = findStanding(idx, homeIdent);
  const away = findStanding(idx, awayIdent);
  if (lens === "fan" && followed) {
    const f = findStanding(idx, followed);
    if (f?.context_line) return { side: "followed", line: f.context_line, row: f };
  }
  const rk = (r) => {
    if (!r) return 999;
    for (const k of ["playoff_seed", "conference_rank", "division_rank", "league_rank"]) {
      if (r[k] != null) return r[k];
    }
    return 999;
  };
  const best = rk(home) <= rk(away) ? home : away;
  return best?.context_line ? { side: best === home ? "home" : "away", line: best.context_line, row: best } : null;
}
