import { test, expect } from "@playwright/test";

/**
 * Smoke test: the LineLock ledger site loads in DEMO MODE with no env keys,
 * no API server, and no secrets. With `LINELOCK_API_URL` unset the pages
 * render from the committed `fixtures/ledger-state.json` — the "data: fixture"
 * pill proves that fallback path is live.
 */
test.describe("demo mode (no API keys)", () => {
  test("home renders from the committed fixture with no uncaught errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(String(err)));

    await page.goto("/");

    // Correct document title (from web/app/layout.tsx metadata).
    await expect(page).toHaveTitle(/LineLock/);

    // The hero thesis line (match the heading by role to avoid ancestor clashes).
    await expect(page.getByRole("heading", { name: /shows you receipts/i })).toBeVisible();

    // Proof we're running from the committed fixture (demo mode), not a live API.
    await expect(page.getByText("data: fixture", { exact: true })).toBeVisible();

    // Injective surface pills are present (exact text = the pill span, not the row).
    await expect(page.getByText("Injective x402", { exact: true })).toBeVisible();
    await expect(page.getByText("USDC CCTP", { exact: true })).toBeVisible();

    // The settled ledger table rendered.
    await expect(page.getByRole("heading", { name: "Settled Ledger" })).toBeVisible();

    // No uncaught client exceptions during load / hydration.
    expect(pageErrors, `unexpected page errors: ${pageErrors.join("\n")}`).toHaveLength(0);
  });

  test("free judge pages (/verify, /agent) render without keys", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("heading", { name: /Judge Panel/ })).toBeVisible();
    // Honest funding status is surfaced, not hidden.
    await expect(page.getByText(/not funded yet/i).first()).toBeVisible();

    await page.goto("/agent");
    await expect(page.getByRole("heading", { name: /Agent view/ })).toBeVisible();
    await expect(page.getByText(/the payment IS the auth/i).first()).toBeVisible();
  });
});
