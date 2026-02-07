import { describe, expect, it } from "vitest"

import { requirementTemplates } from "./requirement-templates"

describe("requirementTemplates", () => {
  it("provides built-in templates", () => {
    expect(requirementTemplates.length).toBeGreaterThan(0)
    expect(requirementTemplates[0]).toHaveProperty("id")
    expect(requirementTemplates[0]).toHaveProperty("prompt")
  })
})

