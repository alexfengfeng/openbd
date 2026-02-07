import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "u1", username: "tester" } })),
}))

const prismaMock = vi.hoisted(() => ({
  requirement: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  workspaceMember: {
    findFirst: vi.fn(),
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}))

import { PUT } from "./route"

describe("/api/requirements/[id] PUT", () => {
  it("accepts order updates", async () => {
    prismaMock.requirement.findUnique.mockResolvedValueOnce({ id: "r1", workspaceId: "w1" })
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({ id: "m1" })
    prismaMock.requirement.update.mockResolvedValueOnce({
      id: "r1",
      title: "t",
      description: null,
      priority: "MEDIUM",
      status: "BACKLOG",
      order: 3,
      tags: [],
      assignee: null,
      createdBy: { id: "u1", username: "tester" },
    })

    const req = new Request("http://localhost/api/requirements/r1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: 3 }),
    })

    const res = await PUT(req as any, { params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000001" }) })
    expect(res.status).toBe(200)
    expect(prismaMock.requirement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ order: 3 }),
      })
    )
  })
})

