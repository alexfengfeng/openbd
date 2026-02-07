import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "u1", username: "tester" } })),
}))

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ ok: true, remaining: 19, resetAt: Date.now() + 1000 })),
}))

const suggestTitleMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/ai/deepseek-client", () => ({
  DeepSeekClient: class DeepSeekClient {
    constructor() {}
    suggestTitle(description: string) {
      return suggestTitleMock(description)
    }
  },
}))

import { rateLimit } from "@/lib/rateLimit"
import { POST } from "./route"

describe("/api/ai/suggest-title", () => {
  beforeEach(() => {
    delete process.env.DEEPSEEK_API_KEY
  })

  it("falls back when DEEPSEEK_API_KEY is missing", async () => {
    const req = new Request("http://localhost/api/ai/suggest-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "这是一个很长的描述\n第二行" }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.degraded).toBe(true)
    expect(typeof json.title).toBe("string")
    expect(json.title.length).toBeGreaterThan(0)
  })

  it("rejects invalid input", async () => {
    const req = new Request("http://localhost/api/ai/suggest-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "" }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it("returns 429 when rate limited", async () => {
    ;(rateLimit as any).mockReturnValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 1000 })
    const req = new Request("http://localhost/api/ai/suggest-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "x" }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(429)
  })

  it("uses deepseek when DEEPSEEK_API_KEY is present", async () => {
    process.env.DEEPSEEK_API_KEY = "k"
    suggestTitleMock.mockResolvedValueOnce("标题X")
    const req = new Request("http://localhost/api/ai/suggest-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "desc" }),
    })
    const res = await POST(req as any)
    const json = await res.json()
    expect(json.title).toBe("标题X")
  })
})

