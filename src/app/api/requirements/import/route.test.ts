import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "u1", username: "tester" } })),
}))

const prismaMock = vi.hoisted(() => ({
  workspaceMember: {
    findFirst: vi.fn(),
  },
  tag: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  requirement: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}))

import { POST } from "./route"

describe("/api/requirements/import", () => {
  it("creates missing tags and requirements", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({ id: "m1" })
    prismaMock.tag.findMany.mockResolvedValueOnce([])
    prismaMock.tag.create.mockImplementation(({ data }: any) => ({ id: `t:${data.name}`, name: data.name }))
    prismaMock.$transaction.mockImplementation(async (ops: any[]) => Promise.all(ops))
    prismaMock.requirement.create.mockResolvedValue({ id: "r1" })

    const req = new Request("http://localhost/api/requirements/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "00000000-0000-0000-0000-000000000000",
        requirements: [{ title: "需求1", tags: ["bug"] }],
      }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.createdCount).toBe(1)
    expect(prismaMock.tag.findMany).toHaveBeenCalled()
    expect(prismaMock.requirement.create).toHaveBeenCalled()
  })

  it("returns 403 when not a member", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/requirements/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "00000000-0000-0000-0000-000000000000",
        requirements: [{ title: "需求1" }],
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })
})

