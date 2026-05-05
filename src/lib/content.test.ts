import { describe, it, expect } from "vitest";
import { projects, softSkills, hobbies, stack, profile, outroQuote } from "./content";

describe("content", () => {
  it("exposes 5 projects in narrative order", () => {
    expect(projects).toHaveLength(5);
    expect(projects.map((p) => p.slug)).toEqual([
      "levels",
      "energizer",
      "mirakl",
      "music-agency",
      "openclaw",
    ]);
  });

  it("each project has a non-empty title and paper color token", () => {
    for (const p of projects) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.paperColor).toMatch(/^paper-(cream|mint|ochre|blush|stone)$/);
    }
  });

  it("openclaw has 3 moons", () => {
    const oc = projects.find((p) => p.slug === "openclaw");
    expect(oc?.moons).toHaveLength(3);
    expect(oc?.moons?.map((m) => m.name)).toEqual(["Webdev", "Vidéo", "Assistance"]);
  });

  it("exposes 4 soft skills with project links", () => {
    expect(softSkills).toHaveLength(4);
    for (const s of softSkills) {
      expect(s.linkedProjectSlugs.length).toBeGreaterThan(0);
      for (const slug of s.linkedProjectSlugs) {
        expect(projects.some((p) => p.slug === slug)).toBe(true);
      }
    }
  });

  it("exposes hobbies, stack, profile, outroQuote", () => {
    expect(hobbies.length).toBeGreaterThanOrEqual(7);
    expect(stack.length).toBeGreaterThanOrEqual(10);
    expect(profile.email.length).toBeGreaterThan(0);
    expect(outroQuote.length).toBeGreaterThan(0);
  });
});
