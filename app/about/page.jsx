// CourtVisual /about: indexable, server-rendered, FAQPage schema attached.
// Content here is evergreen (product-level). Game-specific FAQ lives on /g/[slug].
// Sources of truth for the answers below, keep them in sync when you change:
//   - Scoring formula & floors: lib/data.js (scoreParts, STAKES_FLOOR, verdict)
//   - Why-watch line & voices: lib/data.js (recommend, VOICE_LIST)
//   - Rivalry catalog: lib/rivalries.js (161 named pairs)
//   - Watch data: lib/watch.js + lib/broadcasts.js (ESPN scoreboard)
//   - League coverage: GUIDES keys in lib/watch.js

import SiteHeader from "../../components/SiteHeader";
import StageBackdrop from "../../components/StageBackdrop";

export const metadata = {
  title: "About",
  description:
    "How CourtVisual scores every upcoming game for excitement: the four factors, the championship floor, the plain-English read on every card, and where the data comes from.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About CourtVisual: how every game gets scored",
    description:
      "The four factors, the championship floor, the read on every card, and how to share or attend.",
    url: "https://courtvisual.com/about",
  },
};

const FAQ = [
  {
    q: "How does CourtVisual score a game?",
    a: "You tell us what makes a game worth it to you, and we score every upcoming game 0\u201310 to match. Four things go into it: stakes, rivalry, stars, and matchup. You set how much each one counts, and your whole slate re-ranks in real time. Same engine for the NBA, MLB, NFL, NHL, MLS, WNBA, college, the World Cup, tennis, golf, and boxing.",
    aNode: (
      <>
        <strong>You tell us what makes a game worth it to you</strong>, and we score every upcoming game 0&ndash;10 to match. Four things go into it: <strong>stakes, rivalry, stars, and matchup</strong>. You set how much each one counts, and your whole slate <strong>re-ranks in real time</strong>. Same engine for the NBA, MLB, NFL, NHL, MLS, WNBA, college, the World Cup, tennis, golf, and boxing.
      </>
    ),
  },
  {
    q: "What are the four factors?",
    a: "Stakes: how much is on the line, from division races to knockout rounds to championships. Rivalry: the heat between two teams, drawn from a catalog of 161 named matchups, from the Subway Series to El Tr\u00e1fico. Stars: marquee players and the hottest teams, pulled from live league data. Matchup: how good the game itself projects to be, so a likely nail-biter outranks a blowout.",
    aNode: (
      <>
        <strong>Stakes:</strong> how much is on the line, from division races to knockout rounds to championships. <strong>Rivalry:</strong> the heat between two teams, drawn from a catalog of <strong>161 named matchups</strong>, from the Subway Series to El Tr&aacute;fico. <strong>Stars:</strong> marquee players and the hottest teams, pulled from live league data. <strong>Matchup:</strong> how good the game itself <strong>projects to be</strong>, so a likely nail-biter outranks a blowout.
      </>
    ),
  },
  {
    q: "Why do championship and playoff games carry a floor?",
    a: "Because a Game 7 is a Game 7. If your sliders lean toward regular-season stuff, a plain average could let an NBA Finals game land in the 7s, and that\u2019s just not honest. So championship-size moments (Finals, World Series, knockout rounds) carry a floor: games that big can\u2019t score low. Your taste still ranks everything above it.",
    aNode: (
      <>
        <strong>Because a Game 7 is a Game 7.</strong> If your sliders lean toward regular-season stuff, a plain average could let an NBA Finals game land in the 7s, and that&rsquo;s just not honest. So championship-size moments (Finals, World Series, knockout rounds) <strong>carry a floor: games that big can&rsquo;t score low</strong>. Your taste still ranks everything above it.
      </>
    ),
  },
  {
    q: "What\u2019s the line under each game?",
    a: "Every game gets a plain-English read of why it\u2019s worth watching, written from the same four factors as the score, so it can never tell you something the number doesn\u2019t. Want it faster? Turn on quick chips. Want a different feel? Pick from a set of announcer-inspired voices, or let Mix rotate them across your slate. It all lives in Settings.",
    aNode: (
      <>
        Every game gets a <strong>plain-English read</strong> of why it&rsquo;s worth watching, written from the <strong>same four factors as the score</strong>, so it can never tell you something the number doesn&rsquo;t. Want it faster? Turn on <strong>quick chips</strong>. Want a different feel? Pick from a set of <strong>announcer-inspired voices</strong>, or let <strong>Mix</strong> rotate them across your slate. It all lives in Settings.
      </>
    ),
  },
  {
    q: "What does \"On ABC\" mean on a game card?",
    a: "It\u2019s telling you exactly where to watch. When the national broadcast is locked in, you get it as a banner. When it isn\u2019t out yet, you see the league\u2019s national windows for that game\u2019s day, so a Friday MLB game shows you the Friday window, not the whole week\u2019s worth of channels you don\u2019t need.",
    aNode: (
      <>
        It&rsquo;s telling you <strong>exactly where to watch</strong>. When the national broadcast is locked in, you get it as a banner. When it isn&rsquo;t out yet, you see the league&rsquo;s <strong>national windows for that game&rsquo;s day</strong>, so a Friday MLB game shows you the Friday window, not the whole week&rsquo;s worth of channels you don&rsquo;t need.
      </>
    ),
  },
  {
    q: "Where does the data come from?",
    a: "Schedules and tickets come from Ticketmaster. Broadcast info comes from ESPN\u2019s public feeds, and matchup projections from The Odds API. The watch guides are kept current by hand and checked each season. The rivalry catalog and the scoring itself are ours, the part you won\u2019t find anywhere else.",
    aNode: (
      <>
        Schedules and tickets come from <strong>Ticketmaster</strong>. Broadcast info comes from <strong>ESPN</strong>&rsquo;s public feeds, and matchup projections from <strong>The Odds API</strong>. The watch guides are kept current by hand and checked each season. <strong>The rivalry catalog and the scoring itself are ours</strong>, the part you won&rsquo;t find anywhere else.
      </>
    ),
  },
  {
    q: "Is CourtVisual official, or tied to the leagues?",
    a: "Neither. It\u2019s independent. Team and league names are just how we point you at the right games and broadcasts. Some outbound ticket and streaming links are affiliate links, which help keep the lights on at no extra cost to you.",
    aNode: (
      <>
        <strong>Neither. It&rsquo;s independent.</strong> Team and league names are just how we point you at the right games and broadcasts. Some outbound ticket and streaming links are affiliate links, which help keep the lights on <strong>at no extra cost to you</strong>.
      </>
    ),
  },
  {
    q: "Can I share a game with friends?",
    a: "Yeah, every card has a share button. What you send opens with the score, the matchup, and the watch-or-go actions, so whoever\u2019s on the other end can decide to tune in or come along.",
    aNode: (
      <>
        Yeah, <strong>every card has a share button</strong>. What you send opens with the score, the matchup, and the watch-or-go actions, so whoever&rsquo;s on the other end can decide to <strong>tune in or come along</strong>.
      </>
    ),
  },
  {
    q: "How do I find tickets?",
    a: "Every card shows where to watch by default: the national broadcast or that day\u2019s TV windows, your out-of-market streaming option, and a note on your local market. A tickets link sits right at the bottom of each card for when you\u2019d rather be there in person, so going to the game is always one tap away.",
    aNode: (
      <>
        Every card shows <strong>where to watch</strong> by default: the national broadcast or that day&rsquo;s TV windows, your out-of-market streaming option, and a note on your local market. A <strong>tickets link</strong> sits right at the bottom of each card for when you&rsquo;d rather be there in person, so going to the game is always <strong>one tap away</strong>.
      </>
    ),
  },
  {
    q: "Can I change what counts as exciting later?",
    a: "Anytime. Your excitement mix lives in Settings, and you can re-tune the sliders whenever your mood changes, chasing rivalries this week, close games the next. Your ranking shifts the second you do.",
    aNode: (
      <>
        <strong>Anytime.</strong> Your excitement mix lives in Settings, and you can re-tune the sliders whenever your mood changes, chasing rivalries this week, close games the next. <strong>Your ranking shifts the second you do.</strong>
      </>
    ),
  },
];

const stage = { color: "#ECE7DB", minHeight: "100vh", position: "relative" };
const wrap = { maxWidth: 540, margin: "0 auto", padding: "26px 20px 96px" };
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
    <main className="g-ui" style={stage}>
      <StageBackdrop />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
      <div style={{ ...wrap, position: "relative", zIndex: 1 }}>
        <SiteHeader />
        <div style={eyebrow}>About</div>
        <h1 style={h1}>EVERY GAME, SCORED FOR YOU.</h1>
        <p style={lede}>
          No boring feeds. CourtVisual scores every upcoming game 0&ndash;10 around what <em>you</em> find exciting, so you can find the ones <strong>worth showing up for</strong>, or <strong>worth staying in to watch</strong>.
        </p>
        <p style={lede}>
          <strong>You set what counts.</strong> We score and rank to match, across the NBA, MLB, NFL, NHL, MLS, WNBA, college, the World Cup, tennis, golf, and boxing. Every game comes with a <strong>plain-English read</strong> of why it made the cut.
        </p>
        <p style={sub}>
          <strong>Independent product.</strong> Schedules and tickets via Ticketmaster, broadcasts via ESPN, matchup projections via The Odds API. <strong>The rivalry catalog and scoring engine are CourtVisual&rsquo;s own.</strong>
        </p>

        <h2 style={h2}>Frequently asked</h2>
        {FAQ.map((item, i) => (
          <div key={i} style={card}>
            <p style={q}>{item.q}</p>
            <p style={a}>{item.aNode || item.a}</p>
          </div>
        ))}

        <a href="/" style={backLink}>&larr; Back to the games</a>

        <footer style={footer}>
          Designed &amp; built by{" "}
          <a href="https://www.shawncapizzi.com" target="_blank" rel="noopener" style={creditLink}>
            Shawn M. Capizzi
          </a>{" "}
          &middot; shawncapizzi.com
        </footer>
      </div>
    </main>
  );
}
