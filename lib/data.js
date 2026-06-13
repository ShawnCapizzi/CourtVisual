import { rivalryFactor, isTopRivalry, rivalryInfo } from "./rivalries";
// Team catalog — each carries its color combination: primary (accents) + secondary (CTA).
// NOTE: real team names/colors are trademarked; for a shipped product, license official
// branding or use approximations. These are placeholders for the prototype.
export const TEAMS = [
  { label: "New York Knicks", name: "Knicks", city: "New York", slug: "knicks", league: "nba", primary: "#F58426", secondary: "#006BB6" },
  { label: "Los Angeles Lakers", name: "Lakers", city: "Los Angeles", slug: "lakers", league: "nba", primary: "#552583", secondary: "#FDB927" },
  { label: "Boston Celtics", name: "Celtics", city: "Boston", slug: "celtics", league: "nba", primary: "#007A33", secondary: "#BA9653" },
  { label: "Golden State Warriors", name: "Warriors", city: "San Francisco", slug: "warriors", league: "nba", primary: "#1D428A", secondary: "#FFC72C" },
  { label: "Chicago Bulls", name: "Bulls", city: "Chicago", slug: "bulls", league: "nba", primary: "#CE1141", secondary: "#111111" },
  { label: "Miami Heat", name: "Heat", city: "Miami", slug: "heat", league: "nba", primary: "#98002E", secondary: "#F9A01B" },
  { label: "Phoenix Suns", name: "Suns", city: "Phoenix", slug: "suns", league: "nba", primary: "#1D1160", secondary: "#E56020" },
  { label: "San Antonio Spurs", name: "Spurs", city: "San Antonio", slug: "spurs", league: "nba", primary: "#111111", secondary: "#C4CED4" },
  { label: "Milwaukee Bucks", name: "Bucks", city: "Milwaukee", slug: "bucks", league: "nba", primary: "#00471B", secondary: "#EEE1C6" },
  { label: "Denver Nuggets", name: "Nuggets", city: "Denver", slug: "nuggets", league: "nba", primary: "#0E2240", secondary: "#FEC524" },
  { label: "New York Mets", name: "Mets", city: "Queens", slug: "mets", league: "mlb", primary: "#002D72", secondary: "#FF5910" },
  { label: "New York Yankees", name: "Yankees", city: "Bronx", slug: "yankees", league: "mlb", primary: "#0C2340", secondary: "#8E9CA3" },
  { label: "Atlanta Braves", name: "Braves", city: "Atlanta", slug: "braves", league: "mlb", primary: "#CE1141", secondary: "#13274F" },
  { label: "Philadelphia Phillies", name: "Phillies", city: "Philadelphia", slug: "phillies", league: "mlb", primary: "#E81828", secondary: "#284898" },
  { label: "Los Angeles Dodgers", name: "Dodgers", city: "Los Angeles", slug: "dodgers", league: "mlb", primary: "#005A9C", secondary: "#EF3E42" },
  { label: "Boston Red Sox", name: "Red Sox", city: "Boston", slug: "red-sox", league: "mlb", primary: "#BD3039", secondary: "#0C2340" },
  { label: "Chicago Cubs", name: "Cubs", city: "Chicago", slug: "cubs", league: "mlb", primary: "#0E3386", secondary: "#CC3433" },
  { label: "San Diego Padres", name: "Padres", city: "San Diego", slug: "padres", league: "mlb", primary: "#2F241D", secondary: "#FFC425" },
  { label: "Arizona Cardinals", name: "Cardinals", city: "Glendale", slug: "cardinals", league: "nfl", primary: "#97233F", secondary: "#000000" },
  { label: "Atlanta Falcons", name: "Falcons", city: "Atlanta", slug: "falcons", league: "nfl", primary: "#A71930", secondary: "#000000" },
  { label: "Baltimore Ravens", name: "Ravens", city: "Baltimore", slug: "ravens", league: "nfl", primary: "#241773", secondary: "#000000" },
  { label: "Buffalo Bills", name: "Bills", city: "Orchard Park", slug: "bills", league: "nfl", primary: "#00338D", secondary: "#C60C30" },
  { label: "Carolina Panthers", name: "Panthers", city: "Charlotte", slug: "panthers", league: "nfl", primary: "#0085CA", secondary: "#101820" },
  { label: "Chicago Bears", name: "Bears", city: "Chicago", slug: "bears", league: "nfl", primary: "#0B162A", secondary: "#C83803" },
  { label: "Cincinnati Bengals", name: "Bengals", city: "Cincinnati", slug: "bengals", league: "nfl", primary: "#FB4F14", secondary: "#000000" },
  { label: "Cleveland Browns", name: "Browns", city: "Cleveland", slug: "browns", league: "nfl", primary: "#311D00", secondary: "#FF3C00" },
  { label: "Dallas Cowboys", name: "Cowboys", city: "Arlington", slug: "cowboys", league: "nfl", primary: "#041E42", secondary: "#003594" },
  { label: "Denver Broncos", name: "Broncos", city: "Denver", slug: "broncos", league: "nfl", primary: "#FB4F14", secondary: "#002244" },
  { label: "Detroit Lions", name: "Lions", city: "Detroit", slug: "lions", league: "nfl", primary: "#0076B6", secondary: "#B0B7BC" },
  { label: "Green Bay Packers", name: "Packers", city: "Green Bay", slug: "packers", league: "nfl", primary: "#203731", secondary: "#FFB612" },
  { label: "Houston Texans", name: "Texans", city: "Houston", slug: "texans", league: "nfl", primary: "#03202F", secondary: "#A71930" },
  { label: "Indianapolis Colts", name: "Colts", city: "Indianapolis", slug: "colts", league: "nfl", primary: "#002C5F", secondary: "#002C5F" },
  { label: "Jacksonville Jaguars", name: "Jaguars", city: "Jacksonville", slug: "jaguars", league: "nfl", primary: "#006778", secondary: "#101820" },
  { label: "Kansas City Chiefs", name: "Chiefs", city: "Kansas City", slug: "chiefs", league: "nfl", primary: "#E31837", secondary: "#FFB81C" },
  { label: "Las Vegas Raiders", name: "Raiders", city: "Las Vegas", slug: "raiders", league: "nfl", primary: "#000000", secondary: "#A5ACAF" },
  { label: "Los Angeles Chargers", name: "Chargers", city: "Inglewood", slug: "chargers", league: "nfl", primary: "#0080C6", secondary: "#FFC20E" },
  { label: "Los Angeles Rams", name: "Rams", city: "Inglewood", slug: "rams", league: "nfl", primary: "#003594", secondary: "#FFA300" },
  { label: "Miami Dolphins", name: "Dolphins", city: "Miami Gardens", slug: "dolphins", league: "nfl", primary: "#008E97", secondary: "#FC4C02" },
  { label: "Minnesota Vikings", name: "Vikings", city: "Minneapolis", slug: "vikings", league: "nfl", primary: "#4F2683", secondary: "#FFC62F" },
  { label: "New England Patriots", name: "Patriots", city: "Foxborough", slug: "patriots", league: "nfl", primary: "#002244", secondary: "#C60C30" },
  { label: "New Orleans Saints", name: "Saints", city: "New Orleans", slug: "saints", league: "nfl", primary: "#D3BC8D", secondary: "#101820" },
  { label: "New York Giants", name: "Giants", city: "East Rutherford", slug: "giants", league: "nfl", primary: "#0B2265", secondary: "#A71930" },
  { label: "New York Jets", name: "Jets", city: "East Rutherford", slug: "jets", league: "nfl", primary: "#125740", secondary: "#000000" },
  { label: "Philadelphia Eagles", name: "Eagles", city: "Philadelphia", slug: "eagles", league: "nfl", primary: "#004C54", secondary: "#A5ACAF" },
  { label: "Pittsburgh Steelers", name: "Steelers", city: "Pittsburgh", slug: "steelers", league: "nfl", primary: "#101820", secondary: "#FFB612" },
  { label: "San Francisco 49ers", name: "49ers", city: "Santa Clara", slug: "49ers", league: "nfl", primary: "#AA0000", secondary: "#B3995D" },
  { label: "Seattle Seahawks", name: "Seahawks", city: "Seattle", slug: "seahawks", league: "nfl", primary: "#002244", secondary: "#69BE28" },
  { label: "Tampa Bay Buccaneers", name: "Buccaneers", city: "Tampa", slug: "buccaneers", league: "nfl", primary: "#D50A0A", secondary: "#34302B" },
  { label: "Tennessee Titans", name: "Titans", city: "Nashville", slug: "titans", league: "nfl", primary: "#0C2340", secondary: "#4B92DB" },
  { label: "Washington Commanders", name: "Commanders", city: "Landover", slug: "commanders", league: "nfl", primary: "#5A1414", secondary: "#FFB612" },
  { label: "Arizona Diamondbacks", name: "Diamondbacks", city: "Phoenix", slug: "diamondbacks", league: "mlb", primary: "#A71930", secondary: "#E3D4AD" },
  { label: "Athletics", name: "Athletics", city: "Sacramento", slug: "athletics", league: "mlb", primary: "#003831", secondary: "#EFB21E" },
  { label: "Baltimore Orioles", name: "Orioles", city: "Baltimore", slug: "orioles", league: "mlb", primary: "#DF4601", secondary: "#000000" },
  { label: "Chicago White Sox", name: "White Sox", city: "Chicago", slug: "white-sox", league: "mlb", primary: "#27251F", secondary: "#C4CED4" },
  { label: "Cincinnati Reds", name: "Reds", city: "Cincinnati", slug: "reds", league: "mlb", primary: "#C6011F", secondary: "#000000" },
  { label: "Cleveland Guardians", name: "Guardians", city: "Cleveland", slug: "guardians", league: "mlb", primary: "#00385D", secondary: "#E50022" },
  { label: "Colorado Rockies", name: "Rockies", city: "Denver", slug: "rockies", league: "mlb", primary: "#33006F", secondary: "#000000" },
  { label: "Detroit Tigers", name: "Tigers", city: "Detroit", slug: "tigers", league: "mlb", primary: "#0C2340", secondary: "#FA4616" },
  { label: "Houston Astros", name: "Astros", city: "Houston", slug: "astros", league: "mlb", primary: "#002D62", secondary: "#EB6E1F" },
  { label: "Kansas City Royals", name: "Royals", city: "Kansas City", slug: "royals", league: "mlb", primary: "#004687", secondary: "#BD9B60" },
  { label: "Los Angeles Angels", name: "Angels", city: "Anaheim", slug: "angels", league: "mlb", primary: "#BA0021", secondary: "#003263" },
  { label: "Miami Marlins", name: "Marlins", city: "Miami", slug: "marlins", league: "mlb", primary: "#00A3E0", secondary: "#EF3340" },
  { label: "Milwaukee Brewers", name: "Brewers", city: "Milwaukee", slug: "brewers", league: "mlb", primary: "#12284B", secondary: "#FFC52F" },
  { label: "Minnesota Twins", name: "Twins", city: "Minneapolis", slug: "twins", league: "mlb", primary: "#002B5C", secondary: "#D31145" },
  { label: "Pittsburgh Pirates", name: "Pirates", city: "Pittsburgh", slug: "pirates", league: "mlb", primary: "#27251F", secondary: "#FDB827" },
  { label: "Seattle Mariners", name: "Mariners", city: "Seattle", slug: "mariners", league: "mlb", primary: "#0C2C56", secondary: "#005C5C" },
  { label: "Tampa Bay Rays", name: "Rays", city: "St. Petersburg", slug: "rays", league: "mlb", primary: "#092C5C", secondary: "#8FBCE6" },
  { label: "Texas Rangers", name: "Rangers", city: "Arlington", slug: "rangers", league: "mlb", primary: "#003278", secondary: "#C0111F" },
  { label: "Washington Nationals", name: "Nationals", city: "Washington", slug: "nationals", league: "mlb", primary: "#AB0003", secondary: "#14225A" },
  { label: "Atlanta Hawks", name: "Hawks", city: "Atlanta", slug: "hawks", league: "nba", primary: "#E03A3E", secondary: "#C1D32F" },
  { label: "Brooklyn Nets", name: "Nets", city: "Brooklyn", slug: "nets", league: "nba", primary: "#000000", secondary: "#000000" },
  { label: "Charlotte Hornets", name: "Hornets", city: "Charlotte", slug: "hornets", league: "nba", primary: "#1D1160", secondary: "#00788C" },
  { label: "Cleveland Cavaliers", name: "Cavaliers", city: "Cleveland", slug: "cavaliers", league: "nba", primary: "#860038", secondary: "#FDBB30" },
  { label: "Dallas Mavericks", name: "Mavericks", city: "Dallas", slug: "mavericks", league: "nba", primary: "#00538C", secondary: "#002B5E" },
  { label: "Detroit Pistons", name: "Pistons", city: "Detroit", slug: "pistons", league: "nba", primary: "#1D42BA", secondary: "#C8102E" },
  { label: "Houston Rockets", name: "Rockets", city: "Houston", slug: "rockets", league: "nba", primary: "#CE1141", secondary: "#000000" },
  { label: "Indiana Pacers", name: "Pacers", city: "Indianapolis", slug: "pacers", league: "nba", primary: "#002D62", secondary: "#FDBB30" },
  { label: "Los Angeles Clippers", name: "Clippers", city: "Inglewood", slug: "clippers", league: "nba", primary: "#12173F", secondary: "#C8102E" },
  { label: "Memphis Grizzlies", name: "Grizzlies", city: "Memphis", slug: "grizzlies", league: "nba", primary: "#5D76A9", secondary: "#12173F" },
  { label: "Minnesota Timberwolves", name: "Timberwolves", city: "Minneapolis", slug: "timberwolves", league: "nba", primary: "#0C2340", secondary: "#78BE20" },
  { label: "New Orleans Pelicans", name: "Pelicans", city: "New Orleans", slug: "pelicans", league: "nba", primary: "#0C2340", secondary: "#C8102E" },
  { label: "Oklahoma City Thunder", name: "Thunder", city: "Oklahoma City", slug: "thunder", league: "nba", primary: "#007AC1", secondary: "#EF3B24" },
  { label: "Orlando Magic", name: "Magic", city: "Orlando", slug: "magic", league: "nba", primary: "#0077C0", secondary: "#000000" },
  { label: "Philadelphia 76ers", name: "76ers", city: "Philadelphia", slug: "76ers", league: "nba", primary: "#006BB6", secondary: "#ED174C" },
  { label: "Portland Trail Blazers", name: "Trail Blazers", city: "Portland", slug: "trail-blazers", league: "nba", primary: "#E03A3E", secondary: "#000000" },
  { label: "Sacramento Kings", name: "Kings", city: "Sacramento", slug: "kings", league: "nba", primary: "#5A2D81", secondary: "#000000" },
  { label: "Utah Jazz", name: "Jazz", city: "Salt Lake City", slug: "jazz", league: "nba", primary: "#002B5C", secondary: "#F9A01B" },
  { label: "Washington Wizards", name: "Wizards", city: "Washington", slug: "wizards", league: "nba", primary: "#002B5C", secondary: "#E31837" },
  { label: "Anaheim Ducks", name: "Ducks", city: "Anaheim", slug: "ducks", league: "nhl", primary: "#F47A38", secondary: "#B9975B" },
  { label: "Boston Bruins", name: "Bruins", city: "Boston", slug: "bruins", league: "nhl", primary: "#000000", secondary: "#FFB81C" },
  { label: "Buffalo Sabres", name: "Sabres", city: "Buffalo", slug: "sabres", league: "nhl", primary: "#002654", secondary: "#FCB514" },
  { label: "Carolina Hurricanes", name: "Hurricanes", city: "Raleigh", slug: "hurricanes", league: "nhl", primary: "#CE1126", secondary: "#000000" },
  { label: "Chicago Blackhawks", name: "Blackhawks", city: "Chicago", slug: "blackhawks", league: "nhl", primary: "#CF0A2C", secondary: "#000000" },
  { label: "Colorado Avalanche", name: "Avalanche", city: "Denver", slug: "avalanche", league: "nhl", primary: "#6F263D", secondary: "#236192" },
  { label: "Columbus Blue Jackets", name: "Blue Jackets", city: "Columbus", slug: "blue-jackets", league: "nhl", primary: "#002654", secondary: "#CE1126" },
  { label: "Dallas Stars", name: "Stars", city: "Dallas", slug: "stars", league: "nhl", primary: "#006847", secondary: "#000000" },
  { label: "Detroit Red Wings", name: "Red Wings", city: "Detroit", slug: "red-wings", league: "nhl", primary: "#CE1126", secondary: "#CE1126" },
  { label: "Minnesota Wild", name: "Wild", city: "Saint Paul", slug: "wild", league: "nhl", primary: "#154734", secondary: "#A6192E" },
  { label: "Nashville Predators", name: "Predators", city: "Nashville", slug: "predators", league: "nhl", primary: "#FFB81C", secondary: "#041E42" },
  { label: "New Jersey Devils", name: "Devils", city: "Newark", slug: "devils", league: "nhl", primary: "#CE1126", secondary: "#000000" },
  { label: "New York Islanders", name: "Islanders", city: "Elmont", slug: "islanders", league: "nhl", primary: "#00539B", secondary: "#F47D30" },
  { label: "Philadelphia Flyers", name: "Flyers", city: "Philadelphia", slug: "flyers", league: "nhl", primary: "#F74902", secondary: "#000000" },
  { label: "Pittsburgh Penguins", name: "Penguins", city: "Pittsburgh", slug: "penguins", league: "nhl", primary: "#000000", secondary: "#FCB514" },
  { label: "San Jose Sharks", name: "Sharks", city: "San Jose", slug: "sharks", league: "nhl", primary: "#006D75", secondary: "#EA7200" },
  { label: "Seattle Kraken", name: "Kraken", city: "Seattle", slug: "kraken", league: "nhl", primary: "#001628", secondary: "#99D9D9" },
  { label: "St. Louis Blues", name: "Blues", city: "St. Louis", slug: "blues", league: "nhl", primary: "#002F87", secondary: "#FCB514" },
  { label: "Tampa Bay Lightning", name: "Lightning", city: "Tampa", slug: "lightning", league: "nhl", primary: "#002868", secondary: "#000000" },
  { label: "Utah Mammoth", name: "Mammoth", city: "Salt Lake City", slug: "mammoth", league: "nhl", primary: "#6CACE4", secondary: "#010101" },
  { label: "Vegas Golden Knights", name: "Golden Knights", city: "Las Vegas", slug: "golden-knights", league: "nhl", primary: "#333F42", secondary: "#B4975A" },
  { label: "Washington Capitals", name: "Capitals", city: "Washington", slug: "capitals", league: "nhl", primary: "#C8102E", secondary: "#041E42" },
  { label: "Atlanta United FC", name: "Atlanta United FC", city: "Atlanta", slug: "atlanta-united-fc", league: "mls", primary: "#80000A", secondary: "#A19060" },
  { label: "Austin FC", name: "Austin FC", city: "Austin", slug: "austin-fc", league: "mls", primary: "#00B140", secondary: "#000000" },
  { label: "Charlotte FC", name: "Charlotte FC", city: "Charlotte", slug: "charlotte-fc", league: "mls", primary: "#0085CA", secondary: "#101820" },
  { label: "Chicago Fire FC", name: "Chicago Fire FC", city: "Chicago", slug: "chicago-fire-fc", league: "mls", primary: "#CF0A2C", secondary: "#141946" },
  { label: "FC Cincinnati", name: "FC Cincinnati", city: "Cincinnati", slug: "fc-cincinnati", league: "mls", primary: "#F05323", secondary: "#263B80" },
  { label: "Colorado Rapids", name: "Colorado Rapids", city: "Commerce City", slug: "colorado-rapids", league: "mls", primary: "#862633", secondary: "#8BB8E8" },
  { label: "Columbus Crew", name: "Columbus Crew", city: "Columbus", slug: "columbus-crew", league: "mls", primary: "#000000", secondary: "#FEDD00" },
  { label: "D.C. United", name: "D.C. United", city: "Washington", slug: "d-c-united", league: "mls", primary: "#000000", secondary: "#EF3E42" },
  { label: "FC Dallas", name: "FC Dallas", city: "Frisco", slug: "fc-dallas", league: "mls", primary: "#D71920", secondary: "#003E7E" },
  { label: "Houston Dynamo FC", name: "Houston Dynamo FC", city: "Houston", slug: "houston-dynamo-fc", league: "mls", primary: "#F68712", secondary: "#101820" },
  { label: "Inter Miami CF", name: "Inter Miami CF", city: "Fort Lauderdale", slug: "inter-miami-cf", league: "mls", primary: "#F7B5CD", secondary: "#000000" },
  { label: "LA Galaxy", name: "LA Galaxy", city: "Carson", slug: "la-galaxy", league: "mls", primary: "#00245D", secondary: "#FFC72C" },
  { label: "Los Angeles FC", name: "Los Angeles FC", city: "Los Angeles", slug: "los-angeles-fc", league: "mls", primary: "#000000", secondary: "#C39E6D" },
  { label: "Minnesota United FC", name: "Minnesota United FC", city: "Saint Paul", slug: "minnesota-united-fc", league: "mls", primary: "#8D9093", secondary: "#9BCDE4" },
  { label: "Nashville SC", name: "Nashville SC", city: "Nashville", slug: "nashville-sc", league: "mls", primary: "#ECE83A", secondary: "#1F1646" },
  { label: "New England Revolution", name: "New England Revolution", city: "Foxborough", slug: "new-england-revolution", league: "mls", primary: "#002B5C", secondary: "#C8102E" },
  { label: "New York City FC", name: "New York City FC", city: "New York", slug: "new-york-city-fc", league: "mls", primary: "#6CACE4", secondary: "#041E42" },
  { label: "New York Red Bulls", name: "New York Red Bulls", city: "Harrison", slug: "new-york-red-bulls", league: "mls", primary: "#ED1E36", secondary: "#002F6C" },
  { label: "Orlando City SC", name: "Orlando City SC", city: "Orlando", slug: "orlando-city-sc", league: "mls", primary: "#61259E", secondary: "#FDE192" },
  { label: "Philadelphia Union", name: "Philadelphia Union", city: "Chester", slug: "philadelphia-union", league: "mls", primary: "#071B2C", secondary: "#B3874A" },
  { label: "Portland Timbers", name: "Portland Timbers", city: "Portland", slug: "portland-timbers", league: "mls", primary: "#004812", secondary: "#D69A00" },
  { label: "Real Salt Lake", name: "Real Salt Lake", city: "Sandy", slug: "real-salt-lake", league: "mls", primary: "#B30838", secondary: "#013A81" },
  { label: "San Diego FC", name: "San Diego FC", city: "San Diego", slug: "san-diego-fc", league: "mls", primary: "#C1C6C8", secondary: "#18A0FB" },
  { label: "San Jose Earthquakes", name: "San Jose Earthquakes", city: "San Jose", slug: "san-jose-earthquakes", league: "mls", primary: "#0067B1", secondary: "#000000" },
  { label: "Seattle Sounders FC", name: "Seattle Sounders FC", city: "Seattle", slug: "seattle-sounders-fc", league: "mls", primary: "#5D9732", secondary: "#005595" },
  { label: "Sporting Kansas City", name: "Sporting Kansas City", city: "Kansas City", slug: "sporting-kansas-city", league: "mls", primary: "#91B0D5", secondary: "#002F6C" },
  { label: "St. Louis CITY SC", name: "St. Louis CITY SC", city: "St. Louis", slug: "st-louis-city-sc", league: "mls", primary: "#DE1F36", secondary: "#00A3E0" },
  { label: "Atlanta Dream", name: "Dream", city: "Atlanta", slug: "dream", league: "wnba", primary: "#E31837", secondary: "#00AEEF" },
  { label: "Chicago Sky", name: "Sky", city: "Chicago", slug: "sky", league: "wnba", primary: "#418FDE", secondary: "#FFCD00" },
  { label: "Connecticut Sun", name: "Sun", city: "Uncasville", slug: "sun", league: "wnba", primary: "#F05023", secondary: "#0A2240" },
  { label: "Dallas Wings", name: "Wings", city: "Arlington", slug: "wings", league: "wnba", primary: "#002B5C", secondary: "#C4D600" },
  { label: "Golden State Valkyries", name: "Valkyries", city: "San Francisco", slug: "valkyries", league: "wnba", primary: "#7B46FF", secondary: "#000000" },
  { label: "Indiana Fever", name: "Fever", city: "Indianapolis", slug: "fever", league: "wnba", primary: "#002D62", secondary: "#E03A3E" },
  { label: "Las Vegas Aces", name: "Aces", city: "Las Vegas", slug: "aces", league: "wnba", primary: "#000000", secondary: "#C8102E" },
  { label: "Los Angeles Sparks", name: "Sparks", city: "Los Angeles", slug: "sparks", league: "wnba", primary: "#552583", secondary: "#FDB927" },
  { label: "Minnesota Lynx", name: "Lynx", city: "Minneapolis", slug: "lynx", league: "wnba", primary: "#0C2340", secondary: "#236192" },
  { label: "New York Liberty", name: "Liberty", city: "Brooklyn", slug: "liberty", league: "wnba", primary: "#86CEBC", secondary: "#000000" },
  { label: "Phoenix Mercury", name: "Mercury", city: "Phoenix", slug: "mercury", league: "wnba", primary: "#3A2D6F", secondary: "#E56020" },
  { label: "Portland Fire", name: "Fire", city: "Portland", slug: "fire", league: "wnba", primary: "#E03A3E", secondary: "#FF671F" },
  { label: "Seattle Storm", name: "Storm", city: "Seattle", slug: "storm", league: "wnba", primary: "#2C5234", secondary: "#FBE122" },
  { label: "Washington Mystics", name: "Mystics", city: "Washington", slug: "mystics", league: "wnba", primary: "#E31837", secondary: "#002B5C" },
];

export const teamBySlug = (slug) => TEAMS.find((t) => t.slug === slug);

// Factor labels are fan language; the internal weight KEYS stay stable
// (playoff/rivalry/hot/historic) so game objects, persistence, and the route
// never have to migrate. The `historic` slot is now MATCHUP — competitiveness,
// priced by betting spread when available (records fallback, neutral when unknown).
// True venue/heritage moves to the go-score layer, not a core slider.
export const FACTORS = [
  { key: "playoff", label: "Stakes" },
  { key: "rivalry", label: "Rivalry" },
  { key: "hot", label: "Stars" },
  { key: "historic", label: "Matchup" },
];

export const PRESETS = [
  { id: "balanced", label: "Balanced", w: { playoff: 30, rivalry: 20, hot: 25, historic: 25 } },
  { id: "stakes", label: "High stakes", w: { playoff: 50, rivalry: 20, hot: 15, historic: 15 } },
  { id: "rivalry", label: "Rivalries", w: { playoff: 20, rivalry: 50, hot: 15, historic: 15 } },
  { id: "stars", label: "Star power", w: { playoff: 20, rivalry: 15, hot: 50, historic: 15 } },
  { id: "matchup", label: "Good game", w: { playoff: 20, rivalry: 15, hot: 15, historic: 50 } },
];

export const DEFAULT_WEIGHTS = { playoff: 30, rivalry: 20, hot: 25, historic: 25 };

// Example slate shown only when a team has no live Ticketmaster listings.
// Opponents are drawn from the SAME league as the selected team, so an NBA
// team never shows baseball games. Clearly labeled as examples in the UI.
const SAMPLE_TEMPLATES = [
  { tag: "Rivalry night", date: "Fri · 7:30 PM", ds: "11-14", home: true, playoff: 7, rivalry: 10, hot: 9, historic: 7 },
  { tag: "Marquee matchup", date: "Sat · 8:00 PM", ds: "11-15", home: true, playoff: 6, rivalry: 6, hot: 10, historic: 6 },
  { tag: "Division game", date: "Wed · 7:00 PM", ds: "11-19", home: false, playoff: 8, rivalry: 8, hot: 7, historic: 6 },
  { tag: "Weeknight game", date: "Tue · 7:00 PM", ds: "11-25", home: true, playoff: 5, rivalry: 5, hot: 7, historic: 4 },
];

export function sampleSlate(team) {
  if (!team) return [];
  const opps = TEAMS.filter((t) => t.league === team.league && t.slug !== team.slug).slice(0, 4);
  return SAMPLE_TEMPLATES.map((tpl, i) => {
    const opp = opps[i % opps.length] || { name: "TBD", slug: "tbd" };
    return { ...tpl, opp: opp.name, oppSlug: opp.slug, rivalry: rivalryFactor(team.name, opp.name), topRivals: isTopRivalry(team.name, opp.name), rivalryName: (rivalryInfo(team.name, opp.name) || {}).name || null, url: null, minPrice: null, venue: null };
  });
}

// ---- Stakes Floor ----
// Taste weights rank games against each other, but they can't deflate an
// objectively huge game: a weighted average is compensatory, so under e.g.
// rivalry-heavy weights a non-rival NBA Finals game could never beat ~7.7.
// Big games carry a floor by stage; star power, top-rivalry, and history
// push UP from the floor. Regular-season games are untouched — the fan's
// weights fully own that ranking.
const STAKES_FLOOR = { "Championship": 9.0, "Knockout stage": 8.2, "Playoffs": 7.8 };

export function scoreParts(g, w) {
  const sum = (w.playoff + w.rivalry + w.hot + w.historic) || 1;
  const base = (w.playoff * g.playoff + w.rivalry * g.rivalry + w.hot * g.hot + w.historic * g.historic) / sum;
  let floor = STAKES_FLOOR[g.tag] || 0;
  if (floor) floor += Math.max(0, (g.hot || 0) - 7) * 0.15 + (g.topRivals ? 0.3 : 0);
  floor = Math.min(10, floor);
  const score = Math.round(Math.min(10, Math.max(base, floor)) * 10) / 10;
  return { base: Math.round(base * 10) / 10, floor: Math.round(floor * 10) / 10, floored: floor > base, score };
}
export function scoreOf(g, w) { return scoreParts(g, w).score; }

// ---- Matchup (competitiveness) ----
// How good a game this is likely to be, independent of stakes/stars/rivalry.
// Three honest tiers, best signal first:
//   1. Betting spread — the market prices in injuries, rest, form. Tightest = best.
//   2. Records differential — win-pct gap when we have standings but no odds.
//   3. Neutral 5 — boxing, group stage, anything we can't assess; said plainly.
// Returns { value 0-10, why } so the card can disclose the cause.
export function matchupFromSpread(spread) {
  if (spread == null || isNaN(spread)) return null;
  const a = Math.abs(spread);
  // 0 = pick'em (10), widen toward blowout. ~14+ pts => floor near 2.
  const v = Math.max(2, Math.min(10, 10 - a * 0.6));
  const why = a <= 3 ? "projected close" : a <= 7 ? "competitive" : "lopsided on paper";
  return { value: Math.round(v * 10) / 10, why: `Spread ${a % 1 === 0 ? a : a.toFixed(1)} — ${why}` };
}
export function matchupFromRecords(aPct, bPct) {
  if (aPct == null || bPct == null) return null;
  const quality = (aPct + bPct) / 2;          // both good lifts it
  const gap = Math.abs(aPct - bPct);          // mismatch drags it
  const v = Math.max(2, Math.min(10, 3 + quality * 8 - gap * 6));
  const both = aPct >= 0.55 && bPct >= 0.55;
  const why = both ? "both teams strong" : gap <= 0.08 ? "evenly matched" : "uneven form";
  return { value: Math.round(v * 10) / 10, why: `Records — ${why}` };
}
export const NEUTRAL_MATCHUP = { value: 5, why: "Matchup quality not yet rated" };
export const verdict = (s) => (s >= 9.3 ? "Hottest ticket" : s >= 8.5 ? "Must see" : s >= 7 ? "Highly recommended" : s >= 5.5 ? "Worth attending" : "Good game");

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
