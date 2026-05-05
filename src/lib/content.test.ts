import { describe, it, expect } from "vitest";
import { projects, softSkills, hobbies, stack, profile, outroQuote, starProject } from "./content";

describe("content", () => {
  it("exposes 5 projects in narrative order", () => {
    expect(projects).toHaveLength(5);
    expect(projects.map((p) => p.slug)).toEqual([
      "levels",
      "energizer",
      "mirakl",
      "music-agency",
      "thelook",
    ]);
  });

  it("each project has a non-empty title and paper color token", () => {
    for (const p of projects) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.paperColor).toMatch(/^paper-(cream|mint|ochre|blush|stone)$/);
    }
  });

  it("thelook is the 5th project with correct slug", () => {
    const tl = projects.find((p) => p.slug === "thelook");
    expect(tl).toBeDefined();
    expect(tl?.title).toBe("TheLook Analytics");
    expect(tl?.chapter).toBe("v");
  });

  it("starProject exports openclaw data", () => {
    expect(starProject.slug).toBe("openclaw");
    expect(starProject.title).toBe("OpenClaw");
    expect(starProject.stack.length).toBeGreaterThan(0);
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

  it("softSkills do not reference openclaw", () => {
    for (const s of softSkills) {
      expect(s.linkedProjectSlugs).not.toContain("openclaw");
    }
  });

  it("exposes hobbies, stack, profile, outroQuote", () => {
    expect(hobbies.length).toBeGreaterThanOrEqual(7);
    expect(stack.length).toBeGreaterThanOrEqual(10);
    expect(profile.email.length).toBeGreaterThan(0);
    expect(outroQuote.length).toBeGreaterThan(0);
  });

  it("profile has languages and phone", () => {
    expect(profile.languages).toHaveLength(3);
    expect(profile.phone.length).toBeGreaterThan(0);
  });
});
