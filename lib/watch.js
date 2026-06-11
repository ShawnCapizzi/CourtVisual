// CourtVisual watch layer v1 — "where to watch" guidance per league.
// National rights verified June 2026 (MLB/WNBA deals new for 2026; NBA new deal year one).
// Three tiers of honesty:
//   1. game.networks (exact, from ESPN scoreboard via lib/broadcasts.js) — "Tonight on TNT"
//   2. League national windows + out-of-market streamer — always true at league level
//   3. Local fallback — "check your regional sports network"; we never pretend to solve blackouts.
// Streamer URLs are plain for now — affiliate params drop in alongside the ticket IDs later.

const GUIDES = {
  mlb: {
    national: ["FOX / FS1 (Sat)", "TBS (Tue)", "ESPN (midweek)", "NBC / Peacock (Sun night)", "Apple TV+ (Fri)"],
    streamer: { key: "mlbtv", label: "MLB.TV", url: "https://www.mlb.com/tv", note: "out-of-market games" },
    localNote: "Local games air on your team's regional sports network.",
  },
  nba: {
    national: ["ABC / ESPN", "NBC / Peacock", "Prime Video"],
    streamer: { key: "leaguepass", label: "NBA League Pass", url: "https://www.nba.com/leaguepass", note: "out-of-market games" },
    localNote: "Local games air on your team's regional sports network.",
  },
  nfl: {
    national: ["CBS", "FOX", "NBC (SNF)", "ESPN / ABC (MNF)", "Prime Video (TNF)"],
    streamer: { key: "sundayticket", label: "NFL Sunday Ticket", url: "https://tv.youtube.com/learn/nflsundayticket/", note: "out-of-market Sunday games" },
    localNote: "In-market games air on local broadcast TV.",
  },
  nhl: {
    national: ["ESPN / ABC", "TNT / truTV"],
    streamer: { key: "espnplus", label: "ESPN+", url: "https://plus.espn.com/nhl", note: "national + out-of-market games" },
    localNote: "Local games air on your team's regional sports network.",
  },
  mls: {
    national: ["FOX / FS1 (select)"],
    streamer: { key: "mlsseasonpass", label: "MLS Season Pass", url: "https://tv.apple.com/mls", note: "every match, no blackouts — Apple TV" },
    localNote: "Every match streams on MLS Season Pass.",
  },
  wnba: {
    national: ["ABC / ESPN", "NBC / Peacock", "USA (Wed)", "Prime Video (Thu)", "CBS / Paramount+ (Sat)", "ION"],
    streamer: { key: "wnbaleaguepass", label: "WNBA League Pass", url: "https://www.wnba.com/leaguepass", note: "out-of-market games" },
    localNote: "Local games air on your team's local broadcaster.",
  },
  // Genre-level guides for non-team sports surfaced by search (attached via game.sport).
  // Only unambiguous genres get a guide — "basketball" could be NBA/WNBA/college, so
  // unknown-league team sports stay on the honest default instead of a wrong guess.
  tennis: {
    national: ["ESPN / ESPN2 (Slams)", "TNT / Max (French Open)", "Tennis Channel"],
    streamer: { key: "tennischannel", label: "Tennis Channel", url: "https://www.tennischannel.com", note: "tour events" },
    localNote: "Coverage varies by tournament — check the event broadcaster.",
  },
  boxing: {
    national: ["DAZN", "ESPN / ESPN+", "Prime Video (PPV)", "Netflix (specials)"],
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
  return {
    networks: Array.isArray(game?.networks) && game.networks.length ? game.networks : null, // exact, if known
    national: guide.national,
    streamer: guide.streamer,
    localNote: guide.localNote,
  };
}
