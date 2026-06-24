import GameScoreApp from "../components/GameScoreApp";

export default function Page({ searchParams }) {
  // Seed the entry doorway server-side so a shared ?team= link renders its team on first paint
  // (no flash of the default World Cup doorway before the seed applies on the client).
  const seed = typeof searchParams?.team === "string" ? searchParams.team : null;
  return <GameScoreApp initialSeedTeam={seed} />;
}
