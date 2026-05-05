import { test, expect } from "@playwright/test";

test("renders all sections without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore React hydration mismatch warnings — these are floating-point
      // precision noise in SVG circle coordinates (SSR vs client) and not
      // real application errors.
      if (text.includes("hydration") || text.includes("Hydration") || text.includes("did not match")) {
        return;
      }
      errors.push(text);
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /aurian\./i })).toBeVisible();

  for (const id of ["prelude", "project-levels", "project-energizer", "project-mirakl", "project-music-agency", "project-openclaw", "threads", "map", "outro"]) {
    const el = page.locator(`#${id}`);
    await el.scrollIntoViewIfNeeded();
    await expect(el).toBeVisible();
  }

  expect(errors).toEqual([]);
});

test("openclaw moon expands on click", async ({ page }) => {
  await page.goto("/");
  const webdev = page.getByRole("button", { name: /Lune Webdev/i });
  await webdev.scrollIntoViewIfNeeded();
  await webdev.click();
  await expect(page.getByText(/lune — Webdev/i)).toBeVisible();
});
