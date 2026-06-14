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
    a: "You tell us what makes a game worth it to you — and we score every upcoming game 0\u201310 to match. Four things go into it: stakes, rivalry, stars, and matchup. You set how much each one counts, and your whole slate re-ranks in real time. Same engine for the NBA, MLB, NFL, NHL, MLS, WNBA, college, the World Cup, tennis, golf, and boxing.",
  },
  {
    q: "What are the four factors?",
    a: "Stakes \u2014 how much is on the line: division races, knockout rounds, championships. Rivalry \u2014 the heat between two teams, drawn from a catalog of 161 named matchups, from the Subway Series to El Tr\u00e1fico. Stars \u2014 marquee players and the hottest teams, pulled from live league data. Matchup \u2014 how good the game itself should be, priced off the betting line so a projected nail-biter outranks a blowout.",
  },
  {
    q: "Why do championship and playoff games carry a floor?",
    a: "Because a Game 7 is a Game 7. If your sliders lean toward regular-season stuff, a plain average could let an NBA Finals game land in the 7s \u2014 and that\u2019s just not honest. So championship-size moments (Finals, World Series, knockout rounds) carry a floor: games that big can\u2019t score low. Your taste still ranks everything above it.",
  },
  {
    q: "What does \"On ABC\" mean on a game card?",
    a: "It\u2019s telling you exactly where to watch. When the national broadcast is locked in, you get it as a banner. When it isn\u2019t out yet, you see the league\u2019s national windows for that game\u2019s day \u2014 so a Friday MLB game shows you the Friday window, not the whole week\u2019s worth of channels you don\u2019t need.",
  },
  {
    q: "Where does the data come from?",
    a: "Schedules and tickets come from Ticketmaster. Broadcast info comes from ESPN\u2019s public feeds, and betting lines from The Odds API. The watch guides are kept current by hand and checked each season. The rivalry catalog and the scoring itself are ours \u2014 that\u2019s the part you won\u2019t find anywhere else.",
  },
  {
    q: "Is CourtVisual official, or tied to the leagues?",
    a: "Neither \u2014 it\u2019s independent. Team and league names are just how we point you at the right games and broadcasts. Some outbound ticket and streaming links are affiliate links, which help keep the lights on at no extra cost to you.",
  },
  {
    q: "Can I share a game with friends?",
    a: "Yeah \u2014 every card has a share button. What you send opens with the score, the matchup, and the watch-or-go actions, so whoever\u2019s on the other end can decide to tune in or come along.",
  },
  {
    q: "How do I switch between watching and going?",
    a: "There\u2019s a toggle right next to your team\u2019s name: Watch for TV and streaming, Tickets for being there live. Pick whichever you want as your default in Settings \u2014 and either way, getting tickets is always one tap away.",
  },
  {
    q: "Can I change what counts as exciting later?",
    a: "Anytime. Your excitement mix lives in Settings, and you can re-tune the sliders whenever your mood changes \u2014 chasing rivalries this week, close games the next. Your ranking shifts the second you do.",
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
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <a href="/" style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 20, color: "#ECE7DB", textDecoration: "none", letterSpacing: "-0.01em" }}>
            Court<span style={{ color: "#E1641F" }}>Visual</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a href="/" style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 13, color: "#ECE7DB", textDecoration: "none", padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(236,231,219,0.18)", background: "rgba(255,255,255,0.04)" }}>
              My Games
            </a>
            <a href="/" aria-label="Open CourtVisual" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(236,231,219,0.18)", background: "rgba(255,255,255,0.04)", color: "#ECE7DB", textDecoration: "none" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </a>
          </div>
        </nav>
        <div style={eyebrow}>About</div>
        <h1 style={h1}>EVERY GAME, SCORED FOR YOU.</h1>
        <p style={lede}>
          No boring feeds. CourtVisual scores every upcoming game 0&ndash;10 around what <em>you</em> find exciting &mdash; so you can find the ones worth showing up for, or worth staying in to watch.
          You set what counts. We score and rank to match, across the NBA, MLB, NFL, NHL, MLS, WNBA, college, the World Cup, tennis, golf, and boxing.
        </p>
        <p style={sub}>
          Independent product. Schedules and tickets via Ticketmaster, broadcasts via ESPN, betting lines via The Odds API. The rivalry catalog and scoring engine are CourtVisual&rsquo;s own.
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
