import { defineConfig } from "@playwright/test"
import dotenv from "dotenv"

dotenv.config()

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    headless: true,
  },
  webServer: {
    command: "pnpm dev -p 3000",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
})

