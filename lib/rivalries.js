// CourtVisual rivalry data v2 — built from the USA Sports Rivalries reference (June 2026).
// Pro leagues only (NFL, MLB, NBA, NHL, MLS, WNBA); college is a separate, deliberate expansion.
//
// Each pair carries intensity 1-5 from the research taxonomy:
//   5 nationally famous · 4 strong league-wide · 3 strong regional/division · 2 situational/emerging
// Factor mapping: 5→10, 4→8, 3→7, 2→6; unknown pairs → 5 (neutral baseline).
// isTopRivalry (lights the card pill) is reserved for intensity ≥ 4 so the badge stays scarce.
// Named rivalries ("El Tráfico", "Subway Series") surface on the pill when the user pref is on.
//
// API is unchanged from v1 — rivalryFactor(a, b), isTopRivalry(a, b) — plus rivalryInfo(a, b).
// Inputs can be full names ("San Antonio Spurs") or nicknames ("Spurs"); matching is
// word-boundary alias scanning, longest alias first, so "Suns" never matches "Sun",
// "Wings" never matches "Red Wings", and "Atlanta United" never collides with "D.C. United".

// ---- pairs: [keyA, keyB, intensity, publicName|0] ----
const PAIRS = [
  // NFL
  ["packers","bears",5,0],["steelers","ravens",5,0],["cowboys","eagles",5,0],["cowboys","commanders",4,0],
  ["giants","eagles",4,0],["giants","cowboys",4,0],["chiefs","raiders",5,0],["broncos","raiders",4,0],
  ["chargers","raiders",3,0],["49ers","cowboys",5,0],["49ers","seahawks",4,0],["rams","49ers",4,0],
  ["rams","seahawks",3,0],["patriots","jets",4,0],["bills","dolphins",4,0],["bills","patriots",3,0],
  ["dolphins","jets",3,0],["browns","bengals",4,"Battle of Ohio"],["browns","steelers",4,0],
  ["bengals","steelers",4,0],["chiefs","bills",4,0],["chiefs","bengals",4,0],["colts","patriots",3,0],
  ["saints","falcons",4,0],["buccaneers","saints",3,0],["panthers","falcons",3,0],["panthers","saints",2,0],
  ["lions","packers",4,0],["vikings","packers",4,0],["bears","vikings",3,0],["texans","titans",3,0],
  ["jaguars","titans",3,0],["cardinals","seahawks",2,0],["eagles","49ers",3,0],
  // MLB
  ["yankees","redsox",5,0],["dodgers","giants",5,0],["cubs","cardinals",5,0],
  ["yankees","mets",5,"Subway Series"],["cubs","whitesox",4,"Crosstown Classic"],
  ["dodgers","angels",4,"Freeway Series"],["giants","athletics",3,"Bay Bridge Series"],
  ["astros","rangers",4,"Silver Boot"],["cardinals","royals",4,"I-70 Series"],
  ["guardians","reds",4,"Ohio Cup"],["orioles","nationals",3,"Beltway Series"],
  ["rays","marlins",3,"Citrus Series"],["mets","phillies",4,0],["braves","mets",4,0],
  ["braves","phillies",4,0],["dodgers","padres",4,0],["brewers","cubs",4,0],["brewers","cardinals",3,0],
  ["tigers","whitesox",3,0],["tigers","guardians",3,0],["twins","whitesox",3,0],["yankees","bluejays",3,0],
  ["redsox","rays",3,0],["orioles","yankees",3,0],["mariners","astros",3,0],["dbacks","dodgers",3,0],
  ["padres","giants",3,0],["rockies","dbacks",2,0],["pirates","phillies",3,0],["royals","twins",2,0],
  // NBA
  ["lakers","celtics",5,0],["lakers","clippers",4,"Battle of LA"],["knicks","nets",4,"Battle of New York"],
  ["knicks","heat",4,0],["celtics","76ers",4,0],["celtics","knicks",4,0],["bulls","pistons",4,0],
  ["bulls","knicks",4,0],["warriors","cavaliers",4,0],["warriors","grizzlies",4,0],["warriors","lakers",4,0],
  ["mavericks","suns",4,0],["mavericks","rockets",3,0],["spurs","mavericks",4,0],["spurs","rockets",3,0],
  ["lakers","suns",4,0],["lakers","kings",4,0],["nuggets","timberwolves",4,0],["nuggets","suns",3,0],
  ["thunder","warriors",3,0],["thunder","rockets",3,0],["heat","celtics",4,0],["heat","bucks",3,0],
  ["bucks","celtics",4,0],["76ers","knicks",4,0],["pacers","knicks",4,0],["pistons","cavaliers",3,0],
  ["magic","heat",3,0],["hornets","hawks",2,0],["blazers","lakers",3,0],
  // NHL
  ["bruins","canadiens",5,0],["rangers","islanders",5,0],["rangers","devils",5,"Hudson River Rivalry"],
  ["rangers","flyers",4,0],["flyers","penguins",5,"Battle of Pennsylvania"],["penguins","capitals",5,0],
  ["bruins","rangers",4,0],["bruins","mapleleafs",4,0],["blackhawks","redwings",4,0],
  ["blackhawks","blues",4,0],["wild","blackhawks",3,0],["avalanche","redwings",4,0],
  ["avalanche","blues",3,0],["avalanche","goldenknights",4,0],["goldenknights","sharks",4,0],
  ["kings","ducks",4,"Freeway Face-Off"],["kings","sharks",4,0],["ducks","sharks",3,0],
  ["kraken","canucks",3,0],["stars","wild",3,0],["stars","avalanche",3,0],
  ["lightning","panthers",5,"Battle of Florida"],["hurricanes","capitals",3,0],["hurricanes","rangers",4,0],
  ["bluejackets","penguins",3,0],["predators","blues",3,0],["predators","blackhawks",3,0],
  // MLS
  ["lafc","galaxy",5,"El Tr\u00e1fico"],["sounders","timbers",5,"Cascadia"],["sounders","whitecaps",4,"Cascadia"],
  ["timbers","whitecaps",4,"Cascadia"],["nycfc","redbulls",5,"Hudson River Derby"],
  ["fccincinnati","crew",5,"Hell Is Real"],["sportingkc","stlcity",4,0],["sportingkc","rsl",3,0],
  ["orlandocity","intermiami",4,0],["orlandocity","atlutd",3,0],["atlutd","charlottefc",3,0],
  ["fcdallas","dynamo",4,"Texas Derby"],["austinfc","dynamo",3,0],["austinfc","fcdallas",3,0],
  ["dcunited","redbulls",4,"Atlantic Cup"],["union","redbulls",3,0],["union","nycfc",3,0],
  ["revolution","redbulls",3,0],["fire","stlcity",3,0],["fire","crew",2,0],
  ["rapids","rsl",4,"Rocky Mountain Cup"],["earthquakes","galaxy",4,"California Cl\u00e1sico"],
  ["earthquakes","lafc",3,0],["nashville","atlutd",3,0],["mnutd","sportingkc",2,0],
  ["torontofc","montreal",4,"Canadian Classique"],
  // WNBA
  ["liberty","aces",4,0],["liberty","lynx",3,0],["fever","sky",4,0],["storm","mercury",4,0],
  ["lynx","mercury",4,0],["aces","storm",3,0],["aces","mercury",3,0],["sparks","mercury",3,0],
  ["sparks","storm",3,0],["liberty","sun",3,0],["wings","fever",3,0],["valkyries","aces",2,0],
  ["dream","mystics",2,0],["sky","liberty",3,0],
];

// ---- aliases: canonical key → extra match strings (the key itself always matches) ----
// Multi-word and ambiguous names need explicit aliases; bare "united" is never an alias.
const ALIASES = {
  redsox: ["red sox"], whitesox: ["white sox"], bluejays: ["blue jays"], mapleleafs: ["maple leafs"],
  redwings: ["red wings"], bluejackets: ["blue jackets"], goldenknights: ["golden knights", "vegas golden knights"],
  dbacks: ["diamondbacks", "d backs"], "76ers": ["sixers"], blazers: ["trail blazers"], timberwolves: ["wolves"],
  lafc: ["los angeles fc"], galaxy: ["la galaxy"], redbulls: ["red bulls"], nycfc: ["new york city fc"],
  fccincinnati: ["fc cincinnati"], crew: ["columbus crew"], sportingkc: ["sporting kansas city", "sporting kc"],
  stlcity: ["st louis city"], rsl: ["real salt lake"], orlandocity: ["orlando city"], intermiami: ["inter miami"],
  atlutd: ["atlanta united"], charlottefc: ["charlotte fc"], fcdallas: ["fc dallas"], dynamo: ["houston dynamo"],
  austinfc: ["austin fc"], dcunited: ["dc united"], union: ["philadelphia union"],
  revolution: ["new england revolution"], fire: ["chicago fire"], rapids: ["colorado rapids"],
  earthquakes: ["san jose earthquakes", "quakes"], nashville: ["nashville sc"], mnutd: ["minnesota united"],
  torontofc: ["toronto fc"], montreal: ["cf montreal"],
};

const FACTOR = { 5: 10, 4: 8, 3: 7, 2: 6, 1: 5 };

// Build the alias index once: [{alias, key, re}] sorted longest-first so
// "red wings" wins over "wings" and "sporting kansas city" over "kansas city".
const KEYS = new Set();
for (const [a, b] of PAIRS) { KEYS.add(a); KEYS.add(b); }
const ALIAS_LIST = [];
for (const key of KEYS) ALIAS_LIST.push({ alias: key, key });
for (const [key, extras] of Object.entries(ALIASES)) for (const alias of extras) ALIAS_LIST.push({ alias, key });
ALIAS_LIST.sort((x, y) => y.alias.length - x.alias.length);
for (const e of ALIAS_LIST) e.re = new RegExp(`\\b${e.alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);

const PAIR_MAP = new Map();
const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
for (const [a, b, intensity, name] of PAIRS) PAIR_MAP.set(pairKey(a, b), { intensity, name: name || null });

const norm = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, "").replace(/[^a-z0-9]+/g, " ").trim();

const keyCache = new Map();
export function teamKey(input) {
  const n = norm(input);
  if (!n) return null;
  if (keyCache.has(n)) return keyCache.get(n);
  let found = null;
  for (const e of ALIAS_LIST) { if (e.re.test(n)) { found = e.key; break; } }
  keyCache.set(n, found);
  return found;
}

export function rivalryInfo(a, b) {
  const ka = teamKey(a), kb = teamKey(b);
  if (!ka || !kb || ka === kb) return null;
  const hit = PAIR_MAP.get(pairKey(ka, kb));
  return hit ? { name: hit.name, intensity: hit.intensity, factor: FACTOR[hit.intensity] || 5 } : null;
}

export function rivalryFactor(a, b) {
  const r = rivalryInfo(a, b);
  return r ? r.factor : 5;
}

export function isTopRivalry(a, b) {
  const r = rivalryInfo(a, b);
  return !!r && r.intensity >= 4;
}
