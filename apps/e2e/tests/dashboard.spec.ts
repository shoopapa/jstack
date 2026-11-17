import { expect, test } from "@playwright/test";

test("shows the active org and creates a post", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "E2E Org" })).toBeVisible();

  const title = `Post ${crypto.randomUUID().slice(0, 8)}`;
  await page.getByPlaceholder("Title").fill(title);
  await page.getByRole("button", { name: "Post" }).click();

  await expect(page.getByText(title)).toBeVisible();
});

test("redirects signed-out visitors to sign-in", async ({ browser }) => {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
  await context.close();
});
