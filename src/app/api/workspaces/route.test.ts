import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "u1", username: "tester" } })),
}))

const prismaMock = vi.hoisted(() => ({
  workspace: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}))

import { getServerSession } from "@/lib/auth"
import { GET, POST } from "./route"

describe("/api/workspaces", () => {
  beforeEach(() => {
    prismaMock.workspace.findMany.mockReset()
    prismaMock.workspace.create.mockReset()
    ;(getServerSession as any).mockResolvedValue({ user: { id: "u1", username: "tester" } })
  })

  it("orders by lastVisitedAt then updatedAt", async () => {
    prismaMock.workspace.findMany.mockResolvedValueOnce([])
    const req = new Request("http://localhost/api/workspaces")
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect(prismaMock.workspace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ lastVisitedAt: "desc" }, { updatedAt: "desc" }],
      })
    )
  })

  it("falls back when last_visited_at column is missing", async () => {
    prismaMock.workspace.findMany
      .mockRejectedValueOnce({ code: "P2022", message: "The column `fast_json.workspaces.last_visited_at` does not exist" })
      .mockResolvedValueOnce([])
    const req = new Request("http://localhost/api/workspaces")
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect(prismaMock.workspace.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        orderBy: [{ lastVisitedAt: "desc" }, { updatedAt: "desc" }],
      })
    )
    expect(prismaMock.workspace.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        orderBy: [{ updatedAt: "desc" }],
      })
    )
  })

  it("returns 401 when unauthenticated", async () => {
    ;(getServerSession as any).mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/workspaces")
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })

  it("validates name on create", async () => {
    const req = new Request("http://localhost/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it("creates workspace for authenticated user", async () => {
    prismaMock.workspace.create.mockResolvedValueOnce({ id: "w1", name: "n", slug: "s", owner: { id: "u1", username: "tester" }, members: [] })
    const req = new Request("http://localhost/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "空间" }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    expect(prismaMock.workspace.create).toHaveBeenCalled()
  })
})

