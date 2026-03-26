import { expect, test } from "@playwright/test"

test.describe("Homepage (landing page)", () => {
  test("has the correct page title", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/ObsidianSound/)
  })

  test("shows sign-in link and get-started CTA", async ({ page }) => {
    await page.goto("/")
    // Landing page has "Sign In" for existing users and "Get Started" as primary CTA
    const signInLink = page.getByRole("link", { name: /sign in/i })
    const getStartedLink = page.getByRole("link", { name: /get started/i })

    await expect(signInLink).toBeVisible()
    await expect(getStartedLink).toBeVisible()
  })

  test("sign-in link navigates to /sign-in", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test("get-started link navigates to /music", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /get started/i }).click()
    // "Get Started" goes to /music, which redirects unauthenticated users to /sign-in
    await expect(page).toHaveURL(/\/music|\/sign-in/)
  })
})
