import { LandingPlanets } from "@/components/sections/LandingPlanets";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";
import { profile, projects } from "@/lib/content";

export function Landing() {
  return (
    <section
      id="landing"
      className="relative min-h-screen flex flex-col items-center justify-center px-6"
    >
      <LandingPlanets projects={projects} />
      <h1 className="anim-fade-up serif-italic text-text text-[clamp(72px,12vw,160px)] leading-none text-center relative z-10">
        aurian<span className="text-thread">.</span>
      </h1>
      <p className="anim-fade-in serif-italic text-text-muted text-lg md:text-xl mt-6 max-w-xl text-center relative z-10">
        {profile.tagline}
      </p>
      <div className="absolute bottom-10 z-10">
        <ScrollIndicator />
      </div>
    </section>
  );
}
