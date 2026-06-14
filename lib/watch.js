// CourtVisual watch layer v1 — "where to watch" guidance per league.
// National rights verified June 2026 (MLB/WNBA deals new for 2026; NBA new deal year one).
// Three tiers of honesty:
//   1. game.networks (exact, from ESPN scoreboard via lib/broadcasts.js) — "Tonight on TNT"
//   2. League national windows + out-of-market streamer — always true at league level
//   3. Local fallback — "check your regional sports network"; we never pretend to solve blackouts.
// Streamer URLs are plain for now — affiliate params drop in alongside the ticket IDs later.

const GUIDES = {
  mlb: {
    national: [
      { label: "FOX / FS1 (Sat)", days: [6] },
      { label: "TBS (Tue)", days: [2] },
      { label: "ESPN (midweek)", days: [1, 2, 3, 4] },
      { label: "NBC / Peacock (Sun night)", days: [0] },
      { label: "Apple TV+ (Fri)", days: [5] },
    ],
    streamer: { key: "mlbtv", label: "MLB.TV", url: "https://www.mlb.com/tv", note: "out-of-market games" },
    localNote: "Local games air on your team's regional sports network.",
  },
  nba: {
    national: [{ label: "ABC / ESPN" }, { label: "NBC / Peacock" }, { label: "Prime Video" }],
    streamer: { key: "leaguepass", label: "NBA League Pass", url: "https://www.nba.com/leaguepass", note: "out-of-market games" },
    localNote: "Local games air on your team's regional sports network.",
  },
  nfl: {
    national: [
      { label: "CBS (Sun)", days: [0] },
      { label: "FOX (Sun)", days: [0] },
      { label: "NBC / Peacock (Sun night)", days: [0] },
      { label: "ESPN / ABC (Mon night)", days: [1] },
      { label: "Prime Video (Thu night)", days: [4] },
    ],
    streamer: { key: "sundayticket", label: "NFL Sunday Ticket", url: "https://tv.youtube.com/learn/nflsundayticket/", note: "out-of-market Sunday games" },
    localNote: "In-market games air on local broadcast TV.",
  },
  nhl: {
    national: [{ label: "ESPN / ABC" }, { label: "TNT / truTV" }],
    streamer: { key: "espnplus", label: "ESPN+", url: "https://plus.espn.com/nhl", note: "national + out-of-market games" },
    localNote: "Local games air on your team's regional sports network.",
  },
  mls: {
    national: [{ label: "FOX / FS1 (select)" }],
    streamer: { key: "mlsseasonpass", label: "MLS Season Pass", url: "https://tv.apple.com/mls", note: "every match, no blackouts — Apple TV" },
    localNote: "Every match streams on MLS Season Pass.",
  },
  wnba: {
    national: [
      { label: "ABC / ESPN" },
      { label: "NBC / Peacock" },
      { label: "USA (Wed)", days: [3] },
      { label: "Prime Video (Thu)", days: [4] },
      { label: "CBS / Paramount+ (Sat)", days: [6] },
      { label: "ION" },
    ],
    streamer: { key: "wnbaleaguepass", label: "WNBA League Pass", url: "https://www.wnba.com/leaguepass", note: "out-of-market games" },
    localNote: "Local games air on your team's local broadcaster.",
  },
  // Genre-level guides for non-team sports surfaced by search (attached via game.sport).
  // Only unambiguous genres get a guide — "basketball" could be NBA/WNBA/college, so
  // unknown-league team sports stay on the honest default instead of a wrong guess.
  tennis: {
    national: [{ label: "ESPN / ESPN2 (Slams)" }, { label: "TNT / Max (French Open)" }, { label: "Tennis Channel" }],
    streamer: { key: "tennischannel", label: "Tennis Channel", url: "https://www.tennischannel.com", note: "tour events" },
    localNote: "Coverage varies by tournament — check the event broadcaster.",
  },
  cfb: {
    national: [{ label: "ABC / ESPN (Sat)", days: [6] }, { label: "FOX / FS1 (Sat)", days: [6] }, { label: "CBS (Sat)", days: [6] }, { label: "NBC / Peacock (Sat)", days: [6] }, { label: "Fri primetime", days: [5] }],
    streamer: { key: "espnplus", label: "ESPN App", url: "https://www.espn.com/espnplus/", note: "every game streams on the ESPN App" },
    localNote: "Coverage depends on conference — check the matchup's network.",
  },
  cbb: {
    national: [{ label: "ESPN / ESPN2" }, { label: "FOX / FS1" }, { label: "CBS" }, { label: "TNT / TBS / truTV" }],
    streamer: { key: "espnplus", label: "ESPN App", url: "https://www.espn.com/espnplus/", note: "regular-season & tournament games" },
    localNote: "Conference networks (BTN, SEC Network, ACC Network) carry many games — check the matchup.",
  },
  // Multi-discipline / variable-rights events: stay on the honest generic guide.
  soccer: {
    national: [{ label: "Varies by competition" }],
    streamer: null,
    localNote: "Soccer rights vary widely by league and match — check the event broadcaster.",
  },
  olympics: {
    national: [{ label: "NBC / Peacock" }],
    streamer: { key: "peacock", label: "Peacock", url: "https://www.peacocktv.com", note: "every event streams" },
    localNote: "U.S. Olympic coverage is carried by NBCUniversal across NBC and Peacock.",
  },
  mma: {
    national: [{ label: "Paramount+ (all events)" }, { label: "CBS (select cards)" }],
    streamer: { key: "paramountplus", label: "Paramount+", url: "https://www.paramountplus.com/shows/ufc/", note: "all UFC numbered events & Fight Nights \u2014 no PPV" },
    localNote: "As of 2026 every UFC event streams on Paramount+; select cards simulcast on CBS.",
  },
  golf: {
    national: [{ label: "CBS (weekend)", days: [0, 6] }, { label: "NBC (weekend)", days: [0, 6] }, { label: "Golf Channel (Thu\u2013Fri)", days: [4, 5] }],
    streamer: { key: "espnplus", label: "ESPN+", url: "https://plus.espn.com/pga-tour-live", note: "PGA Tour Live \u2014 featured groups" },
    localNote: "Coverage varies by tournament \u2014 check the event broadcaster.",
  },
  boxing: {
    national: [{ label: "DAZN" }, { label: "ESPN / ESPN+" }, { label: "Prime Video (PPV)" }, { label: "Netflix (specials)" }],
    streamer: { key: "dazn", label: "DAZN", url: "https://www.dazn.com", note: "most major cards" },
    localNote: "Broadcasts vary by promoter — check the bout's rights holder.",
  },
};

const DEFAULT_GUIDE = {
  national: [],
  streamer: null,
  localNote: "Check the event broadcaster for live coverage.",
};

// Resolve watch options for a game. `league` may be null (cross-league search results).
export function watchOptions(league, game) {
  const guide = GUIDES[(league || "").toLowerCase()] || DEFAULT_GUIDE;
  const dow = Number.isInteger(game?.dow) ? game.dow : null;
  let windows = guide.national;
  if (dow !== null && windows.some((w) => w.days)) {
    const matched = windows.filter((w) => !w.days || w.days.includes(dow));
    if (matched.length) windows = matched; // empty match → keep the full honest slate
  }
  return {
    networks: Array.isArray(game?.networks) && game.networks.length ? game.networks : null, // exact, if known
    national: windows.map((w) => w.label),
    dayFiltered: windows !== guide.national,
    streamer: guide.streamer,
    localNote: guide.localNote,
  };
}
