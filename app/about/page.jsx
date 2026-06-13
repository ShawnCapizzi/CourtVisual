// CourtVisual /about — indexable, server-rendered, FAQPage schema attached.
// Content here is evergreen (product-level). Game-specific FAQ lives on /g/[slug].
// Sources of truth for the answers below — keep them in sync when you change:
//   - Scoring formula & floors: lib/data.js (scoreParts, STAKES_FLOOR, verdict)
//   - Rivalry catalog: lib/rivalries.js (161 named pairs)
//   - Watch data: lib/watch.js + lib/broadcasts.js (ESPN scoreboard)
//   - League coverage: GUIDES keys in lib/watch.js

export const metadata = {
  title: "About",
  description:
    "How CourtVisual scores every upcoming game for excitement — the four factors, the championship floor, where the data comes from, and how to share or attend a game.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About CourtVisual — how every game gets scored",
    description:
      "The four factors, the championship floor, where the data comes from, and how to share or attend.",
    url: "https://courtvisual.com/about",
  },
};

const FAQ = [
  {
    q: "How does CourtVisual score a game?",
    a: "Every upcoming game gets a 0–10 score built from four factors: playoff stakes, rivalry, star power, and historic weight. You set how much each one matters using the sliders in Favorites, and we re-rank in real time. The same engine works for the NBA, MLB, NFL, NHL, MLS, WNBA, the World Cup, tennis, and boxing.",
  },
  {
    q: "What are the four factors?",
    a: "Playoff stakes: how much is on the line — division races, knockout rounds, championships. Rivalry: a 0–10 strength drawn from a catalog of 161 named matchups, from the Subway Series to El Tráfico. Star power: marquee players and hot teams, refreshed from live league data. Historic weight: heritage of the stage and the matchup.",
  },
  {
    q: "Why do championship and playoff games carry a floor?",
    a: "A pure weighted average can let a NBA Finals game score in the 7s if your sliders happen to favor regular-season factors. That isn't honest — a Game 7 is a Game 7. CourtVisual adds a stakes floor for championship-size moments (Finals, World Series, knockout rounds), so games that big can't score low. Your sliders still rank everything above the floor.",
  },
  {
    q: "What does \"On ABC\" mean on a game card?",
    a: "When a game's exact national broadcast is published, the watch panel shows it as a banner. When the exact assignment isn't out yet, the panel shows the league's national windows filtered to that game's day of the week — so a Friday MLB game shows Apple TV+ (Friday's window) rather than every window on the schedule.",
  },
  {
    q: "Where does the data come from?",
    a: "Schedules and tickets come from Ticketmaster's Discovery API. National broadcast assignments come from ESPN's public scoreboard feed. League windows, streamers, and rights data are maintained by hand and verified each season. Rivalry intensity and named matchups are CourtVisual's own catalog.",
  },
  {
    q: "Is CourtVisual affiliated with the leagues, teams, or broadcasters?",
    a: "No. CourtVisual is an independent product. Team names, logos, and league names are used to identify their respective games and broadcasts. Outbound links to ticketing and streaming partners may be affiliate links, which support the product at no extra cost to you.",
  },
  {
    q: "Can I share a game?",
    a: "Yes — every game card has a Share with friends button. Shared links open a landing page with the score, the matchup, and the watch and ticket actions, so the person on the other end can decide to tune in or come along.",
  },
  {
    q: "How do I switch between watch and tickets?",
    a: "Each team page has a toggle next to the team name: Watch (TV and streaming) or Tickets (going to the game). You can change the default in Settings. Get tickets stays one tap away in either view.",
  },
];

const stage = { background: "#0A0D12", color: "#ECE7DB", minHeight: "100vh" };
const wrap = { maxWidth: 720, margin: "0 auto", padding: "48px 24px 96px" };
const eyebrow = { fontSize: 11, letterSpacing: "0.14em", fontFamily: "'Archivo',sans-serif", fontWeight: 700, color: "#E1641F", textTransform: "uppercase" };
const h1 = { fontFamily: "'Anton','Archivo Black',sans-serif", fontSize: "clamp(40px,7vw,64px)", lineHeight: 1.02, letterSpacing: "0.005em", margin: "10px 0 14px" };
const lede = { fontSize: 17, lineHeight: 1.55, color: "#ECE7DB", margin: "0 0 24px", maxWidth: 600 };
const sub = { fontFamily: "'Archivo',sans-serif", fontSize: 14, color: "rgba(236,231,219,0.6)", lineHeight: 1.55, marginBottom: 28 };
const h2 = { fontFamily: "'Anton','Archivo Black',sans-serif", fontSize: 22, letterSpacing: "0.01em", margin: "40px 0 16px", color: "#ECE7DB" };
const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(236,231,219,0.10)", borderRadius: 14, padding: "18px 20px", marginBottom: 10 };
const q = { fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 15, color: "#ECE7DB", margin: 0 };
const a = { fontFamily: "'Archivo',sans-serif", fontSize: 14.5, lineHeight: 1.6, color: "rgba(236,231,219,0.78)", margin: "8px 0 0" };
const backLink = { display: "inline-block", marginTop: 40, fontFamily: "'Archivo',sans-serif", fontSize: 13, fontWeight: 700, color: "#ECE7DB", textDecoration: "none", padding: "11px 18px", borderRadius: 10, background: "rgba(236,231,219,0.08)", border: "1px solid rgba(236,231,219,0.14)" };
const footer = { marginTop: 56, paddingTop: 18, borderTop: "1px solid rgba(236,231,219,0.08)", textAlign: "center", fontFamily: "'Archivo',sans-serif", fontSize: 11, color: "rgba(236,231,219,0.38)" };
const creditLink = { color: "rgba(236,231,219,0.6)", fontWeight: 600, textDecoration: "none" };

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function AboutPage() {
  return (
    <main style={stage}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
      <div style={wrap}>
        <div style={eyebrow}>About</div>
        <h1 style={h1}>EVERY GAME, SCORED FOR EXCITEMENT.</h1>
        <p style={lede}>
          CourtVisual ranks every upcoming game 0&ndash;10 so you can find the ones worth showing up for &mdash; or worth staying in to watch.
          You set what excitement means. We score and rank to match, across the NBA, MLB, NFL, NHL, MLS, WNBA, the World Cup, tennis and boxing.
        </p>
        <p style={sub}>
          Independent product. Schedule and ticket data via Ticketmaster. Broadcast data via ESPN. Rivalry catalog and scoring engine by CourtVisual.
        </p>

        <h2 style={h2}>Frequently asked</h2>
        {FAQ.map((item, i) => (
          <div key={i} style={card}>
            <p style={q}>{item.q}</p>
            <p style={a}>{item.a}</p>
          </div>
        ))}

        <a href="/" style={backLink}>← Back to the games</a>

        <footer style={footer}>
          Designed &amp; built by{" "}
          <a href="https://www.shawncapizzi.com" target="_blank" rel="noopener" style={creditLink}>
            Shawn M. Capizzi
          </a>{" "}
          &mdash; shawncapizzi.com
        </footer>
      </div>
    </main>
  );
}
