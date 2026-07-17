import { test, expect } from "@playwright/test";

/**
 * Layout integrity across mobile / tablet / desktop. The wide ledger table is
 * allowed to scroll inside its own `.ledger` container (overflow-x: auto), but
 * the page itself must never scroll horizontally (`body { overflow-x: hidden }`).
 */
const VIEWPORTS = [
  { label: "mobile", width: 375, height: 812 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "desktop", width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  test(`no horizontal overflow @ ${vp.label} (${vp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");

    // The document must not exceed the viewport width (2px sub-pixel tolerance).
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 2);

    // Header brand + primary CTA are visible at every width.
    await expect(page.getByText("LineLock").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Pay .*USDC via x402/i })).toBeVisible();
  });
}

test("primary CTA is a comfortable touch target on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const cta = page.getByRole("button", { name: /Pay .*USDC via x402/i });
  await expect(cta).toBeVisible();
  const box = await cta.boundingBox();
  expect(box, "CTA should have a bounding box").not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(36);
});
