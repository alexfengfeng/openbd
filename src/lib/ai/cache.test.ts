import { describe, expect, it, vi } from "vitest"

import { aiCacheGet, aiCacheSet } from "./cache"

describe("ai cache", () => {
  it("stores and retrieves values before expiry", () => {
    aiCacheSet("k1", { a: 1 }, 1000)
    expect(aiCacheGet<{ a: number }>("k1")?.a).toBe(1)
  })

  it("expires values after ttl", () => {
    const spy = vi.spyOn(Date, "now")
    spy.mockReturnValue(1000)
    aiCacheSet("k2", "v", 10)
    expect(aiCacheGet<string>("k2")).toBe("v")
    spy.mockReturnValue(1011)
    expect(aiCacheGet<string>("k2")).toBeUndefined()
    spy.mockRestore()
  })
})

