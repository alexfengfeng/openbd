import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "u1", username: "tester" } })),
}))

const prismaMock = vi.hoisted(() => ({
  workspaceMember: {
    findFirst: vi.fn(),
  },
  workspace: {
    update: vi.fn(),
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}))

import { POST } from "./route"
import { getServerSession } from "@/lib/auth"

describe("/api/workspaces/[id]/visit", () => {
  it("returns 401 when unauthenticated", async () => {
    ;(getServerSession as any).mockResolvedValueOnce(null)
    const res = await POST(new Request("http://localhost") as any, { params: Promise.resolve({ id: "w1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 403 when not a member", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce(null)
    const res = await POST(new Request("http://localhost") as any, { params: Promise.resolve({ id: "w1" }) })
    expect(res.status).toBe(403)
  })

  it("updates lastVisitedAt for members", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({ id: "m1" })
    prismaMock.workspace.update.mockResolvedValueOnce({ id: "w1" })
    const res = await POST(new Request("http://localhost") as any, { params: Promise.resolve({ id: "w1" }) })
    expect(res.status).toBe(200)
    expect(prismaMock.workspace.update).toHaveBeenCalled()
  })

  it("does not fail when last_visited_at column is missing", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({ id: "m1" })
    prismaMock.workspace.update.mockRejectedValueOnce({
      code: "P2022",
      message: "The column `fast_json.workspaces.last_visited_at` does not exist",
    })
    const res = await POST(new Request("http://localhost") as any, { params: Promise.resolve({ id: "w1" }) })
    expect(res.status).toBe(200)
  })
})

