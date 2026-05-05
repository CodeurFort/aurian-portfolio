import { test, expect } from "@playwright/test";

test("universe loads with title", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("hydration")) {
      errors.push(msg.text());
    }
  });
  await page.goto("/");
  await expect(page.getByText(/aurian\./)).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  expect(errors).toEqual([]);
});
