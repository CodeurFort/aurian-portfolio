import { PageShell } from "@/components/layout/PageShell";
import { Landing } from "@/components/sections/Landing";
import { Prelude } from "@/components/sections/Prelude";
import { ProjectPlanet } from "@/components/sections/ProjectPlanet";
import { OpenclawPlanet } from "@/components/sections/OpenclawPlanet";
import { Threads } from "@/components/sections/Threads";
import { StellarMap } from "@/components/sections/StellarMap";
import { Outro } from "@/components/sections/Outro";
import { ConsoleEasterEgg } from "@/components/ConsoleEasterEgg";
import { PulseDivider } from "@/components/ui/PulseDivider";
import { projects } from "@/lib/content";

export default function Home() {
  const [levels, energizer, mirakl, music, openclaw] = projects;
  return (
    <PageShell>
      <Landing />
      <PulseDivider />
      <Prelude />
      <PulseDivider />
      <ProjectPlanet project={levels} index={0} />
      <PulseDivider />
      <ProjectPlanet project={energizer} index={1} />
      <PulseDivider />
      <ProjectPlanet project={mirakl} index={2} />
      <PulseDivider />
      <ProjectPlanet project={music} index={3} />
      <PulseDivider />
      <OpenclawPlanet project={openclaw} index={4} />
      <PulseDivider />
      <Threads />
      <PulseDivider />
      <StellarMap />
      <PulseDivider />
      <Outro />
      <ConsoleEasterEgg />
    </PageShell>
  );
}
