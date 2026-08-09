import { SectionIntro } from "@/components/shared";
import { HrCard } from "@/components/HrCard";
import { BATTERS } from "@/data";
import { projectHr } from "@/lib/hrModel";

export default function Home() {
  const projected = BATTERS
    .map(batter => ({ batter, projection: projectHr(batter) }))
    .sort((a, b) => b.projection.probability - a.projection.probability);

  return (
    <main className="max-w-4xl mx-auto w-full px-6 py-10">
      <SectionIntro emoji="🔥" label="Home Run Model" note="Poisson projection blending recent form and season HR pace." />
      <div className="grid lg:grid-cols-2 gap-4">
        {projected.map(({ batter, projection }) => (
          <HrCard key={batter.name} batter={batter} projection={projection} />
        ))}
      </div>
    </main>
  );
}
