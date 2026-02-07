import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "u1", username: "tester" } })),
}))

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ ok: true, remaining: 9, resetAt: Date.now() + 1000 })),
}))

const parseRequirementMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/ai/deepseek-client", () => ({
  DeepSeekClient: class DeepSeekClient {
    constructor() {}
    parseRequirement(prompt: string) {
      return parseRequirementMock(prompt)
    }
  },
}))

import { rateLimit } from "@/lib/rateLimit"
import { POST } from "./route"

describe("/api/ai/parse-requirement", () => {
  beforeEach(() => {
    delete process.env.DEEPSEEK_API_KEY
  })

  it("falls back when DEEPSEEK_API_KEY is missing", async () => {
    const req = new Request("http://localhost/api/ai/parse-requirement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "修复登录 bug，很紧急 #bug" }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.degraded).toBe(true)
    expect(json.parsed.title).toBeTruthy()
    expect(json.parsed.tags).toContain("bug")
  })

  it("returns cached response on repeated input", async () => {
    const req1 = new Request("http://localhost/api/ai/parse-requirement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "缓存测试 #bug" }),
    })
    const res1 = await POST(req1 as any)
    expect(res1.status).toBe(200)

    const req2 = new Request("http://localhost/api/ai/parse-requirement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "缓存测试 #bug" }),
    })
    const res2 = await POST(req2 as any)
    const json2 = await res2.json()
    expect(json2.cached).toBe(true)
  })

  it("rejects invalid input", async () => {
    const req = new Request("http://localhost/api/ai/parse-requirement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "" }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it("returns 429 when rate limited", async () => {
    ;(rateLimit as any).mockReturnValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 1000 })
    const req = new Request("http://localhost/api/ai/parse-requirement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "x" }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(429)
  })

  it("degrades when deepseek throws", async () => {
    process.env.DEEPSEEK_API_KEY = "k"
    parseRequirementMock.mockRejectedValueOnce(new Error("fail"))
    const req = new Request("http://localhost/api/ai/parse-requirement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "x" }),
    })
    const res = await POST(req as any)
    const json = await res.json()
    expect(json.degraded).toBe(true)
  })
})

