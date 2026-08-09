import { SectionIntro } from "@/components/shared";
import { HrCard } from "@/components/HrCard";
import { BATTERS } from "@/data";
import { projectHr } from "@/lib/hrModel";

// Scoped to the 4-9 spots in the batting order on purpose -- cleanup and
// complementary bats, not leadoff/table-setter stars.
const LINEUP_SPOT_MIN = 4;
const LINEUP_SPOT_MAX = 9;

export default function Home() {
  const projected = BATTERS
    .filter(batter => batter.battingOrder >= LINEUP_SPOT_MIN && batter.battingOrder <= LINEUP_SPOT_MAX)
    .map(batter => ({ batter, projection: projectHr(batter) }))
    .sort((a, b) => b.projection.probability - a.projection.probability);

  return (
    <main className="max-w-4xl mx-auto w-full px-6 py-10">
      <SectionIntro emoji="🔥" label="Home Run Model" note="Poisson projection blending recent form and season HR pace — batting order spots 4–9." />
      <div className="grid lg:grid-cols-2 gap-4">
        {projected.map(({ batter, projection }) => (
          <HrCard key={batter.name} batter={batter} projection={projection} />
        ))}
      </div>
    </main>
  );
}
