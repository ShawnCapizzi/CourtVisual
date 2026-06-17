// CourtVisual standings context — provider-independent.
// Turns a normalized team standings object into one short, honest line, using the
// correct unit per sport and staying SILENT (returns null) whenever the data isn't
// there or the season is too young to mean anything. No scoring here, no ESPN calls,
// no Supabase; this is the shared shape both the live path and the snapshot path
// feed into. Dead signals (star power, followed player) are intentionally absent.
//
// Normalized context object (every field optional; null = we don't know it):
//   { sport, league, conference, division,
//     wins, losses, ties, otLosses, points, winPct, gamesPlayed,
//     divisionRank, conferenceRank, leagueRank, playoffSeed,
//     divisionGamesBack, wildCardRank, wildCardGamesBack,
//     playoffCutlineGap, playoffCutlineUnit, gamesInHand,
//     clinchStatus, eliminationStatus,
//     early,            // true = pre-threshold; soften to silence
//     confidence,       // 0..1, lower if we computed rather than read official
//     source }          // provenance string, e.g. "espn"

export function ordinal(n) {
  if (n == null || isNaN(n)) return null;
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const has = (x) => x != null && !(typeof x === "number" && isNaN(x));
const confOf = (c) => (typeof c.confidence === "number" ? c.confidence : 0.8);
const gih = (c) => (has(c.gamesInHand) && c.gamesInHand > 0
  ? `, ${c.gamesInHand} game${c.gamesInHand === 1 ? "" : "s"} in hand` : "");

// ---- MLB: games-back and Wild Card, never seed language ----
function mlb(c) {
  if (c.early || !has(c.divisionRank) || !c.division) return null;
  const div = c.division.replace("American League", "AL").replace("National League", "NL");
  const base = `${ordinal(c.divisionRank)} in the ${div}`;
  if (has(c.wildCardGamesBack) && c.wildCardGamesBack === 0) return `${base}, holding a Wild Card spot`;
  if (has(c.wildCardGamesBack) && c.wildCardGamesBack > 0 && c.wildCardGamesBack <= 5)
    return `${base}, ${c.wildCardGamesBack.toFixed(1)} out of a Wild Card`;
  if (has(c.divisionGamesBack) && c.divisionGamesBack > 0 && c.divisionGamesBack <= 8)
    return `${base}, ${c.divisionGamesBack.toFixed(1)} back in the division`;
  return base;
}

// ---- NBA: conference seed and Play-In, never Wild Card ----
function nba(c) {
  if (c.early) return null;
  const seed = has(c.conferenceRank) ? c.conferenceRank : c.playoffSeed;
  if (!has(seed) || !c.conference) return null;
  const conf = c.conference.includes("East") ? "East" : "West";
  if (seed <= 6) return `No. ${seed} seed in the ${conf}`;
  if (seed >= 7 && seed <= 10) return `No. ${seed} in the ${conf}, in Play-In position`;
  if (has(c.playoffCutlineGap)) return `${c.playoffCutlineGap.toFixed(1)} games outside the ${conf} Play-In picture`;
  return `outside the ${conf} Play-In picture`;
}

// ---- NHL: points and games-in-hand, division-based Wild Cards ----
function nhl(c) {
  if (c.early || !has(c.divisionRank) || !c.division) return null;
  const div = c.division.replace(/ Division$/, "");
  const base = `${ordinal(c.divisionRank)} in the ${div}`;
  const sc = statusClause(c);
  if (sc) return `${base}, ${sc}`;
  if (has(c.playoffCutlineGap) && c.playoffCutlineGap === 0) return `${base}, in a playoff spot`;
  if (has(c.playoffCutlineGap) && c.playoffCutlineGap > 0)
    return `${base}, ${c.playoffCutlineGap} point${c.playoffCutlineGap === 1 ? "" : "s"} out of a Wild Card${gih(c)}`;
  return base;
}

// ---- NFL: prefer seed once it means something, else division rank ----
function nfl(c) {
  if (c.early) return null;
  const conf = c.conferenceAbbr || c.conference;
  if (has(c.playoffSeed) && conf) {
    if (c.playoffSeed >= 5 && c.playoffSeed <= 7) return `holding an ${conf} Wild Card spot`;
    if (c.playoffSeed <= 4) return `the No. ${c.playoffSeed} seed in the ${conf}`;
  }
  if (has(c.divisionRank) && c.division) return `${ordinal(c.divisionRank)} in the ${c.division}`;
  return null;
}

// ESPN tags each row with an official playoff-position note; we prefer it over math.
// playoffStatus is the normalized token: clinched | in | wildcard | playin | eliminated.
function statusClause(c) {
  switch (c.playoffStatus) {
    case "clinched": return "clinched a playoff spot";
    case "in": return "in a playoff spot";
    case "wildcard": return "in the Wild Card round";
    case "playin": return "in Play-In position";
    case "eliminated": return "out of the playoff race";
    default: return null;
  }
}

// ---- Points-table sports (MLS): table rank, then official playoff position ----
function table(c) {
  if (c.early) return null;
  const rank = has(c.conferenceRank) ? c.conferenceRank : c.leagueRank;
  if (!has(rank)) return null;
  const where = c.conference ? `the ${c.conference}` : "the table";
  const base = `${ordinal(rank)} in ${where}`;
  const sc = statusClause(c);
  if (sc) return `${base}, ${sc}`;
  if (has(c.playoffCutlineGap) && c.playoffCutlineUnit === "points") {
    if (c.playoffCutlineGap === 0) return `${base}, on the playoff line`;
    if (c.playoffCutlineGap > 0) return `${base}, ${c.playoffCutlineGap} point${c.playoffCutlineGap === 1 ? "" : "s"} above the playoff line`;
    return `${base}, ${Math.abs(c.playoffCutlineGap)} point${Math.abs(c.playoffCutlineGap) === 1 ? "" : "s"} out of a playoff spot`;
  }
  return base;
}

// ---- WNBA: overall seed, top-eight cutline ----
function wnba(c) {
  if (c.early) return null;
  const seed = has(c.playoffSeed) ? c.playoffSeed : c.leagueRank;
  if (!has(seed)) return null;
  if (seed <= 8) return `No. ${seed} seed, holding a playoff spot`;
  if (has(c.playoffCutlineGap)) return `${c.playoffCutlineGap} out of the top eight`;
  return "outside the top eight";
}

const FORMATTERS = { mlb, nba, nhl, nfl, mls: table, wnba };

// Build the standings clause for ONE team. Returns { line, confidence, source } or null.
export function teamStandingLine(sport, c) {
  if (!c || !sport || c.stale) return null; // stale = season hasn't started; don't show last year's table as live
  const fn = FORMATTERS[String(sport).toLowerCase()];
  if (!fn) return null;
  const line = fn(c);
  if (!line) return null;
  return { line, confidence: confOf(c), source: c.source || null };
}

// Lens rule: in the fan lens speak the followed team's standing; in neutral, speak the
// more notable side (better rank/seed), so the clause always has a clear subject.
export function chooseStandingSide(home, away, { lens = "neutral", followedSide = null } = {}) {
  if (lens === "fan" && followedSide && (followedSide === "home" ? home : away)) {
    return { side: followedSide, ctx: followedSide === "home" ? home : away };
  }
  const rk = (c) => (c && has(c.playoffSeed) ? c.playoffSeed
    : c && has(c.conferenceRank) ? c.conferenceRank
    : c && has(c.divisionRank) ? c.divisionRank : 99);
  return rk(home) <= rk(away) ? { side: "home", ctx: home } : { side: "away", ctx: away };
}
