import { defineConfig, devices } from "@playwright/test";

// PORT comes from .env.test (23000). PLAYWRIGHT_BASE_URL wins, which is how you
// aim the suite at an already-running server.
const PORT = process.env.PORT ?? "23000";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: CI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "on-failure" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: ".auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  // Runs the standalone production build — `pnpm test:e2e` builds it first.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: [
          "mkdir -p apps/nextjs/.next/standalone/apps/nextjs/public",
          "cp -r apps/nextjs/public/. apps/nextjs/.next/standalone/apps/nextjs/public/",
          "cp -r apps/nextjs/.next/static apps/nextjs/.next/standalone/apps/nextjs/.next/static",
          "dotenv -e .env.test -- node apps/nextjs/.next/standalone/apps/nextjs/server.js",
        ].join(" && "),
        cwd: "../../",
        url: `${BASE_URL}/api/health`,
        // Never attach to a server this run didn't start (e.g. a dev server on
        // the dev database).
        reuseExistingServer: false,
        timeout: 120_000,
      },
  outputDir: "test-results",
});
