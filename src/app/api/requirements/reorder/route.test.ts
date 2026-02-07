import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "u1", username: "tester" } })),
}))

const prismaMock = vi.hoisted(() => ({
  workspaceMember: {
    findFirst: vi.fn(),
  },
  requirement: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}))

import { PATCH } from "./route"

describe("/api/requirements/reorder", () => {
  it("rejects invalid body", async () => {
    const req = new Request("http://localhost/api/requirements/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    const res = await PATCH(req as any)
    expect(res.status).toBe(400)
  })

  it("updates requirements when authorized", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({ id: "m1" })
    prismaMock.requirement.findMany.mockResolvedValueOnce([{ id: "r1" }, { id: "r2" }])
    prismaMock.requirement.update.mockImplementation(({ where }: any) => ({ where }))
    prismaMock.$transaction.mockResolvedValueOnce([])

    const req = new Request("http://localhost/api/requirements/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "00000000-0000-0000-0000-000000000000",
        updates: [
          { id: "00000000-0000-0000-0000-000000000001", status: "TODO", order: 0 },
          { id: "00000000-0000-0000-0000-000000000002", status: "TODO", order: 1 },
        ],
      }),
    })
    const res = await PATCH(req as any)
    expect(res.status).toBe(200)
    expect(prismaMock.$transaction).toHaveBeenCalled()
  })

  it("degrades when sort_order column is missing", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({ id: "m1" })
    prismaMock.requirement.findMany.mockResolvedValueOnce([{ id: "r1" }])
    prismaMock.requirement.update.mockImplementation(({ where }: any) => ({ where }))
    prismaMock.$transaction
      .mockRejectedValueOnce({ code: "P2022", message: "The column `fast_json.requirements.sort_order` does not exist" })
      .mockResolvedValueOnce([])

    const req = new Request("http://localhost/api/requirements/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "00000000-0000-0000-0000-000000000000",
        updates: [{ id: "00000000-0000-0000-0000-000000000001", status: "DONE", order: 0 }],
      }),
    })
    const res = await PATCH(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.degraded).toBe(true)
  })

  it("returns 403 when not a member", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/requirements/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "00000000-0000-0000-0000-000000000000",
        updates: [{ id: "00000000-0000-0000-0000-000000000001", status: "TODO", order: 0 }],
      }),
    })
    const res = await PATCH(req as any)
    expect(res.status).toBe(403)
  })

  it("returns 404 when some requirements are missing", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({ id: "m1" })
    prismaMock.requirement.findMany.mockResolvedValueOnce([{ id: "only-one" }])
    const req = new Request("http://localhost/api/requirements/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "00000000-0000-0000-0000-000000000000",
        updates: [
          { id: "00000000-0000-0000-0000-000000000001", status: "TODO", order: 0 },
          { id: "00000000-0000-0000-0000-000000000002", status: "TODO", order: 1 },
        ],
      }),
    })
    const res = await PATCH(req as any)
    expect(res.status).toBe(404)
  })
})

