import { PageShell } from "@/components/layout/PageShell";
import { Landing } from "@/components/sections/Landing";
import { Prelude } from "@/components/sections/Prelude";

export default function Home() {
  return (
    <PageShell>
      <Landing />
      <Prelude />
    </PageShell>
  );
}
