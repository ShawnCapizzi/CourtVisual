// CourtVisual /glossary: indexable, server-rendered, DefinedTermSet schema attached.
// Scope is deliberately narrow: the language CourtVisual uses to tell you whether a
// game is worth your time, across three questions, why it matters, where the teams
// stand, how to watch. NOT a rules-of-play dictionary. Source copy lives in
// the product glossary doc; keep wording in sync with lib/data.js verdict bands.
//
// Each term carries a stable #anchor (slug of its name) so on-card tooltips can
// deep-link straight to the definition: /glossary#the-race , /glossary#blackout , etc.

import SiteHeader from "../../components/SiteHeader";
import StageBackdrop from "../../components/StageBackdrop";

export const metadata = {
  title: "Sports glossary",
  description:
    "Plain-English definitions of the sports terms that tell you whether a game is worth watching: stakes, rivalry, the race, the spread, standings, seeding, RSN and blackouts, and where to watch. CourtVisual's glossary, built for casual and serious fans.",
  alternates: { canonical: "/glossary" },
  openGraph: {
    title: "CourtVisual glossary: the language of a good game",
    description:
      "What the words on a game card actually mean, why a game matters, where each team stands, and how to watch.",
    url: "https://courtvisual.com/glossary",
  },
};

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const TIERS = [
  { score: "9.0\u201310.0", tier: "Must see", meaning: "Rearrange your night if you care about this sport." },
  { score: "8.0\u20138.9", tier: "Highly recommended", meaning: "A strong game with several reasons to watch." },
  { score: "7.0\u20137.9", tier: "Worth the watch", meaning: "Good matchup, good stakes, or good entertainment value." },
  { score: "6.0\u20136.9", tier: "Worth checking in", meaning: "Not essential, but a clear reason to keep an eye on it." },
  { score: "5.0\u20135.9", tier: "Fan interest", meaning: "Best for fans of either team." },
  { score: "Below 5.0", tier: "Low priority", meaning: "Skip unless you have a personal reason." },
];

const BUCKETS = [
  {
    id: "why-a-game-matters",
    title: "Why a game matters",
    intro: "The words behind the score, why a game is meaningful, exciting, or skippable.",
    terms: [
      { t: "Stakes", d: "What the game can change. Playoff races, division leads, seeding, elimination, a clinch, or a milestone, anything that makes the outcome matter beyond the final score." },
      { t: "Rivalry", d: "A matchup with extra emotion because the teams, cities, fanbases, or history are connected. Rivalry raises the interest even when the records are uneven.", ex: "Rivalry heat. Records matter less when these two meet." },
      { t: "The race", d: "The competition in the standings for a playoff spot, a division title, a wild card, or tournament qualification. It is why standings context can make a game matter more.", ex: "The race is tight. Both teams are chasing the same wild card spot." },
      { t: "Playoff race", d: "Teams close to making or missing the postseason, where one result can change the picture." },
      { t: "Division race", d: "Teams competing directly to finish first in their division." },
      { t: "Wild card race", d: "The fight for the playoff spots that do not come from winning a division." },
      { t: "Matchup", d: "How the two teams compare. A matchup can be interesting for style, strengths and weaknesses, stars, or tactical contrast.", ex: "Strong matchup. Their offense meets one of the best defenses in the league." },
      { t: "Star power", d: "The game features recognizable or elite players, which makes it more interesting for neutral fans." },
      { t: "Storyline", d: "The human or competitive reason a game feels interesting: a return, a debut, a rematch, a milestone, or a trade angle." },
      { t: "Trap game", d: "A spot where a stronger team could overlook a weaker opponent because of timing, travel, or the schedule." },
      { t: "Upset potential", d: "The underdog has a realistic chance to win, which adds drama." },
      { t: "Close-game potential", d: "The game is likely to stay competitive, usually based on the spread, quality, form, and history.", ex: "Going to be a close one. The spread and the matchup both point that way." },
      { t: "Form", d: "How well a team has been playing recently. Common in soccer, useful everywhere." },
      { t: "Momentum", d: "A team's recent sense of direction, whether it is heating up, slipping, or steadying." },
      { t: "Favored on paper", d: "One team is expected to win based on odds, rankings, records, or projections. It sets expectations without guaranteeing anything.", ex: "Favored on paper, but the road spot makes this interesting." },
      { t: "Favorite", d: "The team expected to win." },
      { t: "Underdog", d: "The team expected to lose. A live underdog is one with a believable path to win anyway." },
      { t: "Point spread", d: "A market estimate of how many points one team is expected to win by, a useful shorthand for expected closeness." },
      { t: "Tight spread", d: "The expected margin is small, a strong sign the game should stay close." },
      { t: "Pick'em", d: "Neither team is clearly favored, a strong close-game signal." },
      { t: "Must-win", d: "A game a team badly needs because of the standings, elimination risk, or momentum. Used carefully, since not every big game is truly must-win." },
      { t: "Elimination game", d: "Lose and you are out. One of the strongest stakes there is.", ex: "Elimination game. Win or the season ends." },
      { t: "Game 7", d: "The final possible game of a best-of-seven series. No extra explanation needed." },
      { t: "Series decider", d: "A game that settles a playoff series or a multi-game matchup." },
      { t: "Clinch game", d: "A team can lock up a spot, title, seed, or advancement with a win." },
      { t: "Ticket value", d: "How attractive the game is live, weighing price against opponent, distance, day and time, and stakes." },
      { t: "Best game on the board", d: "The single most appealing game in a time window or sport. If you watch one tonight, make it this one." },
      { t: "Sneaky good", d: "A game that does not look huge at first but has real upside, often close odds or a rising team." },
      { t: "Skip unless you're a fan", d: "Low stakes and low watchability. Better games are usually on tonight." },
    ],
  },
  {
    id: "where-a-team-stands",
    title: "Where a team stands",
    intro: "Standings, records, seeding, and what a number like .450 actually says.",
    terms: [
      { t: "Standings", d: "The ordered list of teams by record, points, or win percentage. They tell you whether a game affects a race, a seed, or qualification." },
      { t: "Record", d: "A team's wins and losses, sometimes with ties or overtime losses. NFL shows 9-5, NHL 42-25-8, soccer often a points total." },
      { t: "Win percentage", d: "The share of games a team has won, wins divided by games played. A .450 means they have won 45 percent of the time.", ex: ".700 excellent  ·  .500 even  ·  .450 below average but not hopeless  ·  .300 struggling." },
      { t: "Games back", d: "How far a team trails another in the standings. Most common in baseball." },
      { t: "Games ahead", d: "How far a team leads another in the standings." },
      { t: "Standings swing game", d: "A result that can meaningfully change the standings picture, strongest when two teams are in the same race.", ex: "Standings swing game. A win changes the wild card math." },
      { t: "Seed", d: "A team's position in the playoff bracket, which shapes its path and home advantage." },
      { t: "Seeding", d: "The ranking of teams for the playoffs. It keeps late games meaningful even after a team has clinched." },
      { t: "Division", d: "A smaller group of teams within a league. Division games often carry extra standings weight." },
      { t: "Conference", d: "A larger group of teams within a league, common in the NBA, NFL, NHL, and college sports." },
      { t: "Wild card", d: "A playoff spot for a team that did not win its division, which creates strong late-season stakes." },
      { t: "Clinch", d: "To officially secure a playoff spot, division title, seed, or advancement." },
      { t: "Magic number", d: "The combination of a team's wins and a rival's losses needed to clinch. Most common in baseball." },
      { t: "Eliminated", d: "A team can no longer qualify. Stakes drop, though spoiler value can remain." },
      { t: "Spoiler", d: "An eliminated or lower team that can still hurt a contender's chances." },
      { t: "In control", d: "A team can reach its goal just by winning its own games." },
      { t: "Needs help", d: "A team needs other results to go its way, so winning alone is not enough." },
      { t: "Strength of schedule", d: "How tough a team's opponents have been, which says whether a record is more or less impressive than it looks." },
      { t: "Table", d: "The standings in soccer. Three points here could move them up the table." },
      { t: "Points", d: "Soccer standings units: a win is 3, a draw is 1, a loss is 0. It is why one result can matter so much." },
      { t: "Draw", d: "A tied result. Both teams take one point in league or group play." },
      { t: "Goal difference", d: "Goals scored minus goals allowed, often the tiebreaker in a soccer table." },
      { t: "Group stage", d: "The early tournament round where teams play within a small group, as in the World Cup." },
      { t: "Knockout round", d: "A tournament stage where the loser goes home. Usually high excitement.", ex: "Knockout round. Win and advance, lose and go home." },
      { t: "Derby", d: "A local soccer rivalry between teams from the same city or region." },
      { t: "Promotion and relegation", d: "In many soccer leagues the top teams move up a level and the bottom teams move down, which adds stakes far beyond the title race." },
      { t: "Better than the record", d: "A team more dangerous than its win-loss mark suggests, often because of injuries, schedule, or recent form." },
    ],
  },
  {
    id: "how-a-game-reaches-you",
    title: "How a game reaches you",
    intro: "Where it is played, where it airs, and how you can actually watch or go.",
    terms: [
      { t: "Where to watch", d: "The channel, app, or service carrying the game. One of the most practical parts of a card." },
      { t: "National broadcast", d: "A game shown across the country on a major network. Easy to find and built for a big audience." },
      { t: "Regional broadcast", d: "A game shown mainly in the teams' local markets, which can be harder to find from elsewhere." },
      { t: "RSN", d: "A regional sports network, the local channel that carries many of a nearby team's regular-season games.", ex: "RSN game. Check your local provider before game time." },
      { t: "Blackout", d: "A restriction that blocks a game in certain places or on certain services. A common source of frustration in local markets." },
      { t: "In-market", d: "A game involving a team inside your local TV region, often subject to RSN rules and blackouts." },
      { t: "Out-of-market", d: "A game involving teams outside your local region, which may need a league package or a national feed." },
      { t: "Streaming", d: "Watching through an internet app or service. Availability can depend on your subscription and location." },
      { t: "Cable", d: "Watching through a traditional TV provider or a live-TV package." },
      { t: "League pass", d: "A subscription with access to many of a league's games, useful out of market but often subject to blackouts." },
      { t: "Local market", d: "The area where a team counts as local for TV rights. It is why your ZIP code can change where a game is available." },
      { t: "Home and away", d: "The home team plays in its own venue with the crowd and travel edge; the away team is on the road." },
      { t: "Neutral site", d: "A game played at neither team's home venue, which can create event energy and remove the home edge." },
      { t: "Venue", d: "The stadium, arena, ballpark, course, or track. It matters for atmosphere, distance, and weather." },
      { t: "Local game", d: "A game near you, a strong reason to go in person." },
      { t: "Road trip game", d: "A game worth traveling for, when the event is strong and not too far away." },
      { t: "Start time", d: "When the game begins, shown in your local time. Each sport has its own name for it: first pitch in baseball, tip-off in basketball, kickoff in football and soccer, puck drop in hockey, tee time in golf, green flag in racing." },
      { t: "Main card and main event", d: "In combat sports the main card is the featured set of fights; the main event is the biggest or final fight, usually the real draw." },
    ],
  },
];

const ALL_TERMS = [
  ...TIERS.map((r) => ({ t: r.tier, d: r.meaning })),
  ...BUCKETS.flatMap((b) => b.terms),
];

const GLOSSARY_LD = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "CourtVisual Sports Glossary",
  description:
    "The language CourtVisual uses to explain whether a game is worth your time: why it matters, where each team stands, and how to watch.",
  url: "https://courtvisual.com/glossary",
  hasDefinedTerm: ALL_TERMS.map((term) => ({
    "@type": "DefinedTerm",
    name: term.t,
    description: term.d,
    inDefinedTermSet: "https://courtvisual.com/glossary",
    url: `https://courtvisual.com/glossary#${slug(term.t)}`,
  })),
};

const stage = { color: "#ECE7DB", minHeight: "100vh", position: "relative" };
const wrap = { maxWidth: 540, margin: "0 auto", padding: "26px 20px 96px" };
const eyebrow = { fontSize: 11, letterSpacing: "0.14em", fontFamily: "'Archivo',sans-serif", fontWeight: 700, color: "#E1641F", textTransform: "uppercase" };
const h1 = { fontFamily: "'Anton','Archivo Black',sans-serif", fontSize: "clamp(38px,7vw,60px)", lineHeight: 1.02, letterSpacing: "0.005em", margin: "10px 0 14px" };
const lede = { fontSize: 17, lineHeight: 1.55, color: "#ECE7DB", margin: "0 0 14px", maxWidth: 600 };
const sub = { fontFamily: "'Archivo',sans-serif", fontSize: 14, color: "rgba(236,231,219,0.6)", lineHeight: 1.55, marginBottom: 18 };
const h2 = { fontFamily: "'Anton','Archivo Black',sans-serif", fontSize: 22, letterSpacing: "0.01em", margin: "40px 0 8px", color: "#ECE7DB", scrollMarginTop: 90 };
const bucketIntro = { fontFamily: "'Archivo',sans-serif", fontSize: 13.5, color: "rgba(236,231,219,0.55)", lineHeight: 1.5, margin: "0 0 18px" };

const jumpNav = { display: "flex", flexWrap: "wrap", gap: 8, margin: "22px 0 6px" };
const jumpLink = { fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 700, color: "rgba(236,231,219,0.9)", textDecoration: "none", padding: "8px 13px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(236,231,219,0.12)" };

const tierTable = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(236,231,219,0.10)", borderRadius: 14, padding: "6px 18px", marginBottom: 8 };
const tierRow = { display: "flex", gap: 14, alignItems: "baseline", padding: "12px 0", borderBottom: "1px solid rgba(236,231,219,0.08)" };
const tierScore = { fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 13, color: "#FF7A2E", width: 92, flexShrink: 0, letterSpacing: "0.01em" };
const tierName = { display: "block", fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 14.5, color: "#ECE7DB" };
const tierMeaning = { display: "block", fontFamily: "'Archivo',sans-serif", fontSize: 13.5, color: "rgba(236,231,219,0.7)", lineHeight: 1.45, marginTop: 2 };

const termRow = { marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid rgba(236,231,219,0.06)" };
const termName = { display: "block", fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 15.5, color: "#ECE7DB", scrollMarginTop: 90 };
const termDef = { display: "block", fontFamily: "'Archivo',sans-serif", fontSize: 14, lineHeight: 1.55, color: "rgba(236,231,219,0.74)", marginTop: 4 };
const termEx = { display: "block", fontFamily: "'Archivo',sans-serif", fontStyle: "italic", fontSize: 13, color: "#FF7A2E", marginTop: 6, lineHeight: 1.45 };

const backLink = { display: "inline-block", marginTop: 40, fontFamily: "'Archivo',sans-serif", fontSize: 13, fontWeight: 700, color: "#ECE7DB", textDecoration: "none", padding: "11px 18px", borderRadius: 10, background: "rgba(236,231,219,0.08)", border: "1px solid rgba(236,231,219,0.14)" };
const footer = { marginTop: 56, paddingTop: 18, borderTop: "1px solid rgba(236,231,219,0.08)", textAlign: "center", fontFamily: "'Archivo',sans-serif", fontSize: 11, color: "rgba(236,231,219,0.38)" };
const creditLink = { color: "rgba(236,231,219,0.6)", fontWeight: 600, textDecoration: "none" };

export default function GlossaryPage() {
  return (
    <main className="g-ui" style={stage}>
      <StageBackdrop />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(GLOSSARY_LD) }} />
      <div style={{ ...wrap, position: "relative", zIndex: 1 }}>
        <SiteHeader />
        <div style={eyebrow}>Glossary</div>
        <h1 style={h1}>THE LANGUAGE OF A GOOD GAME.</h1>
        <p style={lede}>
          Not a rulebook. This is the plain-English decoder for the words on a CourtVisual card, the language we use to tell you whether a game is <strong>worth your time</strong>.
        </p>
        <p style={sub}>
          It answers three questions: <strong>why a game matters</strong>, <strong>where each team stands</strong>, and <strong>how you can actually watch or attend</strong>. Written to be quick for casual fans and still useful to serious ones.
        </p>

        <nav style={jumpNav} aria-label="Jump to a section">
          {BUCKETS.map((b) => (
            <a key={b.id} href={`#${b.id}`} style={jumpLink}>{b.title}</a>
          ))}
        </nav>

        <h2 style={h2} id="the-cv-score">The CV score</h2>
        <p style={bucketIntro}>
          Every game gets a Game Excitement Index from 0 to 10, our estimate of how watchable or attendable it is. The CV score is the user-facing version, and here is what each band means.
        </p>
        <div style={tierTable}>
          {TIERS.map((r, i) => (
            <div key={i} style={i === TIERS.length - 1 ? { ...tierRow, borderBottom: "none" } : tierRow}>
              <span style={tierScore}>{r.score}</span>
              <div>
                <span id={slug(r.tier)} style={tierName}>{r.tier}</span>
                <span style={tierMeaning}>{r.meaning}</span>
              </div>
            </div>
          ))}
        </div>

        {BUCKETS.map((b) => (
          <section key={b.id}>
            <h2 style={h2} id={b.id}>{b.title}</h2>
            <p style={bucketIntro}>{b.intro}</p>
            {b.terms.map((term) => (
              <div key={term.t} style={termRow}>
                <span id={slug(term.t)} style={termName}>{term.t}</span>
                <span style={termDef}>{term.d}</span>
                {term.ex && <span style={termEx}>{term.ex}</span>}
              </div>
            ))}
          </section>
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
