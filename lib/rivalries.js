// CourtVisual — rivalry intelligence.
// Built from the USA sports rivalry reference (intensity 1–5). Powers the
// rivalry factor score, the rivalry weighting in the ranking, and the
// "Top Rivals" badge. Keyed by team NICKNAME pairs (order-independent),
// because games carry nicknames ("Spurs", "Red Sox") not full names.
//
// intensity: 5 national rivalry · 4 strong league-wide · 3 regional/division
//            · 2 emerging/situational · 1 mild

const PAIRS = [
  // NBA
  ["lakers", "celtics", 5], ["lakers", "clippers", 4], ["knicks", "nets", 4],
  ["knicks", "heat", 4], ["celtics", "76ers", 4], ["celtics", "knicks", 4],
  ["bulls", "pistons", 4], ["bulls", "knicks", 4], ["warriors", "cavaliers", 4],
  ["warriors", "grizzlies", 4], ["warriors", "lakers", 4], ["mavericks", "suns", 4],
  ["mavericks", "rockets", 3], ["spurs", "mavericks", 4], ["spurs", "rockets", 3],
  ["lakers", "suns", 4], ["lakers", "kings", 4], ["nuggets", "timberwolves", 4],
  ["nuggets", "suns", 3], ["thunder", "warriors", 3], ["thunder", "rockets", 3],
  ["heat", "celtics", 4], ["heat", "bucks", 3], ["bucks", "celtics", 4],
  ["76ers", "knicks", 4], ["pacers", "knicks", 4], ["pistons", "cavaliers", 3],
  ["magic", "heat", 3], ["hornets", "hawks", 2], ["trail blazers", "lakers", 3],

  // MLB
  ["yankees", "red sox", 5], ["dodgers", "giants", 5], ["cubs", "cardinals", 5],
  ["yankees", "mets", 5], ["cubs", "white sox", 4], ["dodgers", "angels", 4],
  ["giants", "athletics", 3], ["astros", "rangers", 4], ["cardinals", "royals", 4],
  ["guardians", "reds", 4], ["orioles", "nationals", 3], ["rays", "marlins", 3],
  ["mets", "phillies", 4], ["braves", "mets", 4], ["braves", "phillies", 4],
  ["dodgers", "padres", 4], ["brewers", "cubs", 4], ["brewers", "cardinals", 3],
  ["tigers", "white sox", 3], ["tigers", "guardians", 3], ["twins", "white sox", 3],
  ["yankees", "blue jays", 3], ["red sox", "rays", 3], ["orioles", "yankees", 3],
  ["mariners", "astros", 3], ["diamondbacks", "dodgers", 3], ["padres", "giants", 3],
  ["rockies", "diamondbacks", 2], ["pirates", "phillies", 3], ["royals", "twins", 2],

  // NFL
  ["packers", "bears", 5], ["steelers", "ravens", 5], ["cowboys", "eagles", 5],
  ["cowboys", "commanders", 4], ["giants", "eagles", 4], ["giants", "cowboys", 4],
  ["chiefs", "raiders", 5], ["broncos", "raiders", 4], ["chargers", "raiders", 3],
  ["49ers", "cowboys", 5], ["49ers", "seahawks", 4], ["rams", "49ers", 4],
  ["rams", "seahawks", 3], ["patriots", "jets", 4], ["bills", "dolphins", 4],
  ["bills", "patriots", 3], ["dolphins", "jets", 3], ["browns", "bengals", 4],
  ["browns", "steelers", 4], ["bengals", "steelers", 4], ["chiefs", "bills", 4],
  ["chiefs", "bengals", 4], ["colts", "patriots", 3], ["saints", "falcons", 4],
  ["buccaneers", "saints", 3], ["panthers", "falcons", 3], ["panthers", "saints", 2],
  ["lions", "packers", 4], ["vikings", "packers", 4], ["bears", "vikings", 3],
  ["texans", "titans", 3], ["jaguars", "titans", 3], ["cardinals", "seahawks", 2],
  ["eagles", "49ers", 3],

  // NHL
  ["bruins", "canadiens", 5], ["rangers", "islanders", 5], ["rangers", "devils", 5],
  ["rangers", "flyers", 4], ["flyers", "penguins", 5], ["penguins", "capitals", 5],
  ["bruins", "rangers", 4], ["bruins", "maple leafs", 4], ["blackhawks", "red wings", 4],
  ["blackhawks", "blues", 4], ["wild", "blackhawks", 3], ["avalanche", "red wings", 4],
  ["avalanche", "blues", 3], ["avalanche", "golden knights", 4], ["golden knights", "sharks", 4],
  ["kings", "ducks", 4], ["kings", "sharks", 4], ["ducks", "sharks", 3],
  ["kraken", "canucks", 3], ["stars", "wild", 3], ["stars", "avalanche", 3],
  ["lightning", "panthers", 5], ["hurricanes", "capitals", 3], ["hurricanes", "rangers", 4],
  ["blue jackets", "penguins", 3],

  // MLS / WNBA / College (Tier 1)
  ["lafc", "galaxy", 5], ["sounders", "timbers", 5],
  ["liberty", "aces", 4], ["fever", "sky", 4],
  ["ohio state", "michigan", 5], ["alabama", "auburn", 5], ["texas", "oklahoma", 5],
  ["duke", "north carolina", 5], ["kentucky", "louisville", 5],
];

const MAP = new Map();
for (const [a, b, i] of PAIRS) { MAP.set(`${a}|${b}`, i); MAP.set(`${b}|${a}`, i); }

const nick = (s) => (s || "").toString().toLowerCase().trim();

export function rivalryIntensity(a, b) {
  return MAP.get(`${nick(a)}|${nick(b)}`) || 0;
}

// Map intensity to the 0–10 rivalry factor; non-rivals sit at a 4 baseline.
const FACTOR = { 0: 4, 1: 5, 2: 6, 3: 7, 4: 9, 5: 10 };
export function rivalryFactor(a, b) {
  return FACTOR[rivalryIntensity(a, b)] ?? 4;
}

// "Top Rivals" = strong league-wide rivalry or bigger.
export function isTopRivalry(a, b) {
  return rivalryIntensity(a, b) >= 4;
}
