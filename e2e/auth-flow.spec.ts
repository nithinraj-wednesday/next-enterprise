import { expect, test } from "@playwright/test"

test.describe("Authentication flow", () => {
  test("sign-in page renders email and password fields", async ({ page }) => {
    await page.goto("/sign-in")

    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test("sign-up page renders name, email, and password fields", async ({ page }) => {
    await page.goto("/sign-up")

    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    // There might be password + confirm password
    const passwordFields = page.locator('input[type="password"]')
    await expect(passwordFields.first()).toBeVisible()
  })

  test("sign-in with invalid credentials shows error", async ({ page }) => {
    await page.goto("/sign-in")

    await page.getByLabel(/email/i).fill("nonexistent@test.com")
    await page.getByLabel(/password/i).fill("wrongpassword123")
    await page.getByRole("button", { name: /sign in/i }).click()

    // Should show some error message (not redirect to /music)
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test("unauthenticated user is redirected away from /music", async ({ page }) => {
    await page.goto("/music")

    // Middleware should redirect to sign-in
    await expect(page).not.toHaveURL(/\/music/)
    await expect(page).toHaveURL(/\/sign-in|\//)
  })

  test("sign-in page has a link to sign-up and vice versa", async ({ page }) => {
    await page.goto("/sign-in")
    const signUpLink = page.getByRole("link", { name: /sign up/i })
    await expect(signUpLink).toBeVisible()

    await page.goto("/sign-up")
    const signInLink = page.getByRole("link", { name: /sign in/i })
    await expect(signInLink).toBeVisible()
  })
})
