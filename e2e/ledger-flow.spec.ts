import { test, expect } from "@playwright/test";

/**
 * Core ledger-page journeys — both run env-free against the fixture-backed site.
 *
 * 1. The x402 pay -> reveal flow on the home page (sealed -> 402 quote -> reveal).
 *    This is a client-side UI preview of the paid flow; it never signs or spends.
 * 2. Ledger row -> per-pick audit page, exercising invariants I1 (pre-kickoff
 *    receipt) and I2 (pick-hash re-verify).
 */
test.describe("core ledger flows", () => {
  test("x402 sealed -> 402 quote -> reveal (UI preview, no funds)", async ({ page }) => {
    await page.goto("/");

    // The next pick starts sealed behind an x402 clearance.
    const pay = page.getByRole("button", { name: /Pay .*USDC via x402/i });
    await expect(pay).toBeVisible();
    await pay.click();

    // The 402 quote surface.
    await expect(page.getByText(/HTTP 402/).first()).toBeVisible();

    // Sign the (simulated) EIP-3009 authorization.
    await page.getByRole("button", { name: /Sign & submit/i }).click();

    // The pick reveals; the receipt-is-the-timestamp thesis is shown.
    await expect(page.getByText(/REVEALED/).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/receipt = pre-kickoff timestamp/i).first()).toBeVisible();
  });

  test("ledger row -> per-pick audit page (I1 + I2)", async ({ page }) => {
    await page.goto("/");

    // The settled ledger has clickable fixtures.
    await expect(page.getByRole("heading", { name: "Settled Ledger" })).toBeVisible();
    const firstFixture = page.locator("a.fixture-link").first();
    await expect(firstFixture).toBeVisible();
    await firstFixture.click();

    // We land on a /pick/<hash> audit page.
    await expect(page).toHaveURL(/\/pick\//);

    // The invariant panels render.
    await expect(page.getByRole("heading", { name: /Receipt predates kickoff \(I1\)/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Pick-hash re-verify \(I2\)/ })).toBeVisible();
  });
});
