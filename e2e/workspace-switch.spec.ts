import { test, expect } from "@playwright/test"
import { SignJWT } from "jose"

async function authToken() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.trim().length < 32) {
    throw new Error("JWT_SECRET is missing or too short")
  }
  return new SignJWT({ userId: "u1", username: "tester" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(secret))
}

test("workspace switcher updates route", async ({ page, context, baseURL }) => {
  const token = await authToken()
  await context.addCookies([
    { name: "auth-token", value: token, url: baseURL! },
  ])

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: { id: "u1", username: "tester" } }),
    })
  })

  await page.route("**/api/workspaces", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        workspaces: [
          { id: "old", name: "旧空间", slug: "old", _count: { requirements: 1, members: 1 } },
          { id: "new", name: "新空间", slug: "new", _count: { requirements: 0, members: 1 } },
        ],
      }),
    })
  })

  await page.route("**/api/workspaces/*/visit", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
  })

  await page.route("**/api/requirements?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        requirements: [
          { id: "r1", title: "需求1", description: "", status: "BACKLOG", priority: "MEDIUM", order: 0, tags: [] },
        ],
      }),
    })
  })

  await page.goto("/workspaces/old/requirements")
  await expect(page.getByText("旧空间")).toBeVisible()

  await page.getByText("旧空间").click()
  await expect(page.getByPlaceholder("搜索工作空间...")).toBeVisible()

  await page.getByText("新空间").click()
  await expect(page).toHaveURL(/\/workspaces\/new\/requirements/)
})

