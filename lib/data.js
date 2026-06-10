// Team catalog — each carries its color combination: primary (accents) + secondary (CTA).
// NOTE: real team names/colors are trademarked; for a shipped product, license official
// branding or use approximations. These are placeholders for the prototype.
const NBA_SLUGS = new Set(["knicks","lakers","celtics","warriors","bulls","heat","suns","spurs","bucks","nuggets"]);

export const TEAMS = [
  { city: "New York", name: "Knicks", slug: "knicks", primary: "#F58426", secondary: "#006BB6" },
  { city: "Los Angeles", name: "Lakers", slug: "lakers", primary: "#552583", secondary: "#FDB927" },
  { city: "Boston", name: "Celtics", slug: "celtics", primary: "#007A33", secondary: "#BA9653" },
  { city: "Golden State", name: "Warriors", slug: "warriors", primary: "#1D428A", secondary: "#FFC72C" },
  { city: "Chicago", name: "Bulls", slug: "bulls", primary: "#CE1141", secondary: "#111111" },
  { city: "Miami", name: "Heat", slug: "heat", primary: "#98002E", secondary: "#F9A01B" },
  { city: "Phoenix", name: "Suns", slug: "suns", primary: "#1D1160", secondary: "#E56020" },
  { city: "San Antonio", name: "Spurs", slug: "spurs", primary: "#111111", secondary: "#C4CED4" },
  { city: "Milwaukee", name: "Bucks", slug: "bucks", primary: "#00471B", secondary: "#EEE1C6" },
  { city: "Denver", name: "Nuggets", slug: "nuggets", primary: "#0E2240", secondary: "#FEC524" },
  { city: "New York", name: "Mets", slug: "mets", primary: "#002D72", secondary: "#FF5910" },
  { city: "New York", name: "Yankees", slug: "yankees", primary: "#0C2340", secondary: "#8E9CA3" },
  { city: "Atlanta", name: "Braves", slug: "braves", primary: "#CE1141", secondary: "#13274F" },
  { city: "Philadelphia", name: "Phillies", slug: "phillies", primary: "#E81828", secondary: "#284898" },
  { city: "Los Angeles", name: "Dodgers", slug: "dodgers", primary: "#005A9C", secondary: "#EF3E42" },
  { city: "Boston", name: "Red Sox", slug: "red-sox", primary: "#BD3039", secondary: "#0C2340" },
  { city: "Chicago", name: "Cubs", slug: "cubs", primary: "#0E3386", secondary: "#CC3433" },
  { city: "San Diego", name: "Padres", slug: "padres", primary: "#2F241D", secondary: "#FFC425" },
].map((t) => ({ ...t, label: `${t.city} ${t.name}`, league: NBA_SLUGS.has(t.slug) ? "nba" : "mlb" }));

export const teamBySlug = (slug) => TEAMS.find((t) => t.slug === slug);

export const FACTORS = [
  { key: "playoff", label: "Playoff stakes" },
  { key: "rivalry", label: "Rivalry" },
  { key: "hot", label: "Star power" },
  { key: "historic", label: "Historic weight" },
];

export const PRESETS = [
  { id: "balanced", label: "Balanced", w: { playoff: 30, rivalry: 20, hot: 25, historic: 25 } },
  { id: "stakes", label: "High stakes", w: { playoff: 50, rivalry: 20, hot: 15, historic: 15 } },
  { id: "rivalry", label: "Rivalries", w: { playoff: 20, rivalry: 50, hot: 15, historic: 15 } },
  { id: "stars", label: "Star power", w: { playoff: 20, rivalry: 15, hot: 50, historic: 15 } },
  { id: "history", label: "History", w: { playoff: 20, rivalry: 15, hot: 15, historic: 50 } },
];

export const DEFAULT_WEIGHTS = { playoff: 30, rivalry: 20, hot: 25, historic: 25 };

// Sample slate — live schedule loads per team via the Ticketmaster Discovery API.
export const GAMES = [
  { opp: "Braves", oppSlug: "braves", date: "Oct 12 · 7:10 PM", ds: "10-12", home: true, tag: "Wild Card Game", playoff: 10, rivalry: 7, hot: 10, historic: 9 },
  { opp: "Yankees", oppSlug: "yankees", date: "Oct 5 · 8:00 PM", ds: "10-05", home: true, tag: "Division Clincher", playoff: 8, rivalry: 10, hot: 9, historic: 7 },
  { opp: "Phillies", oppSlug: "phillies", date: "Oct 8 · 1:05 PM", ds: "10-08", home: true, tag: "Weekend Game", playoff: 6, rivalry: 8, hot: 7, historic: 5 },
  { opp: "Dodgers", oppSlug: "dodgers", date: "Oct 15 · 7:10 PM", ds: "10-15", home: true, tag: "Star Pitcher Debut", playoff: 3, rivalry: 5, hot: 8, historic: 4 },
];

export function scoreOf(g, w) {
  const sum = (w.playoff + w.rivalry + w.hot + w.historic) || 1;
  return Math.round(((w.playoff * g.playoff + w.rivalry * g.rivalry + w.hot * g.hot + w.historic * g.historic) / sum) * 10) / 10;
}
export const verdict = (s) => (s >= 8.5 ? "Must see" : s >= 7 ? "Highly recommended" : s >= 5.5 ? "Worth attending" : "Good game");

// color helpers
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r * (1 - f)); g = Math.round(g * (1 - f)); b = Math.round(b * (1 - f));
  return `rgb(${r},${g},${b})`;
}
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const a = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
// Pick whichever of ink/white has the HIGHER WCAG contrast ratio against the bg.
const L_INK = 0.0123; // relative luminance of #16130F
export const textOn = (hex) => {
  const L = lum(hex);
  const rWhite = 1.05 / (L + 0.05);
  const rInk = (L + 0.05) / (L_INK + 0.05);
  return rInk >= rWhite ? "#16130F" : "#FFFFFF";
};
