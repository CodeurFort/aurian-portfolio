import { PageShell } from "@/components/layout/PageShell";

export default function Home() {
  return (
    <PageShell>
      <section id="landing" className="min-h-screen flex items-center justify-center">
        <h1 className="serif-italic text-text text-[clamp(72px,12vw,160px)]">aurian.</h1>
      </section>
    </PageShell>
  );
}
