import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: [
        "src/stores/**/*.{ts,tsx}",
        "src/components/GlobalHotkeys.tsx",
        "src/components/command/**/*.{ts,tsx}",
        "src/components/workspaces/**/*.{ts,tsx}",
        "src/components/requirements/{DraggableBoard,DraggableRequirementCard,RequirementCard,QuickEditDialog,VoiceInput}.tsx",
        "src/components/requirements/dragLogic.ts",
        "src/components/ai/AIRequirementCreator.tsx",
        "src/lib/ai/**/*.{ts,tsx}",
        "src/lib/templates/**/*.{ts,tsx}",
        "src/app/api/ai/**/*.{ts,tsx}",
        "src/app/api/workspaces/route.ts",
        "src/app/api/workspaces/[id]/visit/route.ts",
        "src/app/api/requirements/reorder/**/*.{ts,tsx}",
        "src/app/api/requirements/import/**/*.{ts,tsx}",
        "src/app/api/requirements/route.ts",
        "src/app/api/requirements/[id]/route.ts"
      ],
      exclude: [
        "src/components/ui/**",
        "src/styles/**"
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
})

