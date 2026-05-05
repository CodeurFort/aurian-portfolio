import { PageShell } from "@/components/layout/PageShell";
import { Landing } from "@/components/sections/Landing";
import { Prelude } from "@/components/sections/Prelude";
import { ProjectPlanet } from "@/components/sections/ProjectPlanet";
import { OpenclawPlanet } from "@/components/sections/OpenclawPlanet";
import { Threads } from "@/components/sections/Threads";
import { StellarMap } from "@/components/sections/StellarMap";
import { Outro } from "@/components/sections/Outro";
import { ConsoleEasterEgg } from "@/components/ConsoleEasterEgg";
import { projects } from "@/lib/content";

export default function Home() {
  const [levels, energizer, mirakl, music, openclaw] = projects;
  return (
    <PageShell>
      <Landing />
      <Prelude />
      <ProjectPlanet project={levels} index={0} />
      <ProjectPlanet project={energizer} index={1} />
      <ProjectPlanet project={mirakl} index={2} />
      <ProjectPlanet project={music} index={3} />
      <OpenclawPlanet project={openclaw} index={4} />
      <Threads />
      <StellarMap />
      <Outro />
      <ConsoleEasterEgg />
    </PageShell>
  );
}
