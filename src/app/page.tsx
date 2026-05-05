import { PageShell } from "@/components/layout/PageShell";
import { Landing } from "@/components/sections/Landing";
import { Prelude } from "@/components/sections/Prelude";
import { ProjectPlanet } from "@/components/sections/ProjectPlanet";
import { projects } from "@/lib/content";

export default function Home() {
  const [levels, energizer, mirakl, music] = projects;
  return (
    <PageShell>
      <Landing />
      <Prelude />
      <ProjectPlanet project={levels} index={0} />
      <ProjectPlanet project={energizer} index={1} />
      <ProjectPlanet project={mirakl} index={2} />
      <ProjectPlanet project={music} index={3} />
      {/* openclaw + moons in next task */}
    </PageShell>
  );
}
