import fs from "node:fs";
import { expect, test as setup } from "@playwright/test";

import { createOrgFor, db } from "../helpers/db";

const PASSWORD = "e2e-password-123";

setup("sign up, join an org, and sign in", async ({ page, request }) => {
  fs.mkdirSync(".auth", { recursive: true });
  const runId = crypto.randomUUID();
  const email = `e2e-${runId}@e2e.test`;

  // Create the user through better-auth so the password is hashed for real.
  const res = await request.post("/api/auth/sign-up/email", {
    data: { email, password: PASSWORD, name: "E2E User" },
  });
  expect(res.ok()).toBeTruthy();
  const { user } = (await res.json()) as { user: { id: string } };

  await createOrgFor(user.id, "E2E Org");
  fs.writeFileSync(".auth/run.json", JSON.stringify({ userId: user.id }));

  // Sign in through the UI so the saved session is a real one.
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
  await page.context().storageState({ path: ".auth/user.json" });

  await db.destroy();
});
