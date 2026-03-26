import { expect, test } from "@playwright/test"

test.describe("Shared playlist (public page)", () => {
  test("visiting /shared with an invalid token shows not-found or error", async ({ page }) => {
    const response = await page.goto("/shared/nonexistent-token-12345")

    // The page should either return 404 or show an error/not-found message
    // It should NOT crash — this is a publicly accessible route
    const body = await page.textContent("body")
    const is404 = response?.status() === 404
    const hasErrorMessage = /not found|doesn.t exist|unavailable|no playlist/i.test(body ?? "")

    expect(is404 || hasErrorMessage).toBe(true)
  })

  test("/shared route is accessible without authentication", async ({ page }) => {
    // Even though most routes require auth, /shared/* is public
    await page.goto("/shared/some-token")

    // Should NOT redirect to sign-in — shared pages are publicly accessible
    await expect(page).not.toHaveURL(/\/sign-in/)
    // URL should still contain /shared
    await expect(page).toHaveURL(/\/shared/)
  })
})

test.describe("API health check", () => {
  test("GET /api/health returns 200", async ({ request }) => {
    const response = await request.get("/api/health")
    expect(response.status()).toBe(200)
  })
})
