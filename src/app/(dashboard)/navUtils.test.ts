import { describe, expect, it } from "vitest"

import { computeActiveHref, getWorkspaceIdFromPath } from "./navUtils"

describe("navUtils", () => {
  it("picks longest matching href as active", () => {
    const items = [{ href: "/workspaces" }, { href: "/workspaces/w1/requirements" }]
    expect(computeActiveHref("/workspaces/w1/requirements", items)).toBe("/workspaces/w1/requirements")
  })

  it("extracts workspace id from workspace routes", () => {
    expect(getWorkspaceIdFromPath("/workspaces/w1/requirements")).toBe("w1")
    expect(getWorkspaceIdFromPath("/workspaces/new")).toBe(null)
    expect(getWorkspaceIdFromPath("/dashboard")).toBe(null)
  })
})

