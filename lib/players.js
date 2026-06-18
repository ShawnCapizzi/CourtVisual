// Player-follow: a curated map of marquee players to their national team.
// World Cup-scoped to start, the names fans actually follow during the tournament.
//
// HONESTY RULE (do not relax): this maps a player to their TEAM only. We never claim a
// player will appear in a given match, lineups are not confirmed until kickoff, and there
// are injuries, suspensions, and rotation. Everything surfaced is possessive and team-level
// ("Messi's Argentina"), never "watch Messi tonight". Keep the card language in that lane.
//
// Fields:
//   name  - full display name (what gets stored when followed, shown in the chip + autocomplete)
//   short - surname used in the possessive flag ("Messi's Argentina")
//   team  - national-team string to match against the feed's team names (ESPN displayName)
//   label - optional friendlier team label for the flag (defaults to `team`)
//   alt   - optional extra strings to match the team on (feed naming varies)
export const STARS = [
  { name: "Lionel Messi", short: "Messi", team: "Argentina" },
  { name: "Juli\u00e1n \u00c1lvarez", short: "\u00c1lvarez", team: "Argentina" },
  { name: "Lautaro Mart\u00ednez", short: "Lautaro", team: "Argentina" },
  { name: "Kylian Mbapp\u00e9", short: "Mbapp\u00e9", team: "France" },
  { name: "Antoine Griezmann", short: "Griezmann", team: "France" },
  { name: "Ousmane Demb\u00e9l\u00e9", short: "Demb\u00e9l\u00e9", team: "France" },
  { name: "Cristiano Ronaldo", short: "Ronaldo", team: "Portugal" },
  { name: "Bruno Fernandes", short: "Bruno Fernandes", team: "Portugal" },
  { name: "Rafael Le\u00e3o", short: "Le\u00e3o", team: "Portugal" },
  { name: "Vit\u00ednha", short: "Vit\u00ednha", team: "Portugal" },
  { name: "Vin\u00edcius J\u00fanior", short: "Vin\u00edcius", team: "Brazil" },
  { name: "Rodrygo", short: "Rodrygo", team: "Brazil" },
  { name: "Raphinha", short: "Raphinha", team: "Brazil" },
  { name: "Neymar", short: "Neymar", team: "Brazil" },
  { name: "Jude Bellingham", short: "Bellingham", team: "England" },
  { name: "Harry Kane", short: "Kane", team: "England" },
  { name: "Bukayo Saka", short: "Saka", team: "England" },
  { name: "Phil Foden", short: "Foden", team: "England" },
  { name: "Lamine Yamal", short: "Yamal", team: "Spain" },
  { name: "Pedri", short: "Pedri", team: "Spain" },
  { name: "Rodri", short: "Rodri", team: "Spain" },
  { name: "Virgil van Dijk", short: "Van Dijk", team: "Netherlands" },
  { name: "Cody Gakpo", short: "Gakpo", team: "Netherlands" },
  { name: "Jamal Musiala", short: "Musiala", team: "Germany" },
  { name: "Florian Wirtz", short: "Wirtz", team: "Germany" },
  { name: "Kai Havertz", short: "Havertz", team: "Germany" },
  { name: "Kevin De Bruyne", short: "De Bruyne", team: "Belgium" },
  { name: "Luka Modri\u0107", short: "Modri\u0107", team: "Croatia" },
  { name: "Robert Lewandowski", short: "Lewandowski", team: "Poland" },
  { name: "Erling Haaland", short: "Haaland", team: "Norway" },
  { name: "Mohamed Salah", short: "Salah", team: "Egypt" },
  { name: "Victor Osimhen", short: "Osimhen", team: "Nigeria" },
  { name: "Achraf Hakimi", short: "Hakimi", team: "Morocco" },
  { name: "Federico Valverde", short: "Valverde", team: "Uruguay" },
  { name: "Darwin N\u00fa\u00f1ez", short: "N\u00fa\u00f1ez", team: "Uruguay" },
  { name: "Christian Pulisic", short: "Pulisic", team: "United States", label: "USA", alt: ["USA"] },
  { name: "Alphonso Davies", short: "Davies", team: "Canada" },
  { name: "Son Heung-min", short: "Son", team: "Korea Republic", label: "South Korea", alt: ["South Korea", "Korea"] },
];

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const BY_NAME = new Map(STARS.map((s) => [norm(s.name), s]));
const teamInHay = (s, hay) => hay.includes(norm(s.team)) || (s.alt || []).some((a) => hay.includes(norm(a)));

// Typeahead: match on player name, team, or friendly label.
export function searchStars(q, limit = 6) {
  const n = norm(q);
  if (!n) return [];
  return STARS.filter((s) => norm(s.name).includes(n) || norm(s.team).includes(n) || (s.label && norm(s.label).includes(n))).slice(0, limit);
}

// True if any followed player's national team appears in the given game text.
export function playerHit(players, hayRaw) {
  const hay = norm(hayRaw);
  if (!hay) return false;
  return (players || []).some((p) => {
    const s = BY_NAME.get(norm(p));
    return s && teamInHay(s, hay);
  });
}

// Safe possessive flag for a card, e.g. "Messi's Argentina". Team-level only, never an
// appearance claim. Returns null when no followed player's team is in this game.
export function playerFlag(game, players) {
  const hay = norm(`${game.matchup || ""} ${game.opp || ""} ${game.homeTeam || ""} ${game.awayTeam || ""}`);
  if (!hay) return null;
  for (const p of players || []) {
    const s = BY_NAME.get(norm(p));
    if (s && teamInHay(s, hay)) return `${s.short}\u2019s ${s.label || s.team}`;
  }
  return null;
}
