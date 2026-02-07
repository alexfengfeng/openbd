import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "u1", username: "tester" } })),
}))

const prismaMock = vi.hoisted(() => ({
  workspaceMember: {
    findFirst: vi.fn(),
  },
  requirement: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}))

import { getServerSession } from "@/lib/auth"
import { GET, POST } from "./route"

describe("/api/requirements", () => {
  beforeEach(() => {
    prismaMock.workspaceMember.findFirst.mockReset()
    prismaMock.requirement.findMany.mockReset()
    prismaMock.requirement.create.mockReset()
    ;(getServerSession as any).mockResolvedValue({ user: { id: "u1", username: "tester" } })
  })

  it("uses board ordering when view=board", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({ id: "m1" })
    prismaMock.requirement.findMany.mockResolvedValueOnce([])
    const req = new Request(
      "http://localhost/api/requirements?workspaceId=00000000-0000-0000-0000-000000000000&view=board"
    )
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect(prismaMock.requirement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ status: "asc" }, { order: "asc" }, { updatedAt: "desc" }],
      })
    )
  })

  it("degrades when sort_order column is missing", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({ id: "m1" })
    prismaMock.requirement.findMany
      .mockRejectedValueOnce({ code: "P2022", message: "The column `fast_json.requirements.sort_order` does not exist" })
      .mockResolvedValueOnce([
        {
          id: "r1",
          workspaceId: "w1",
          title: "t",
          description: null,
          priority: "MEDIUM",
          status: "BACKLOG",
          assigneeId: null,
          dueDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: null,
          createdBy: { id: "u1", username: "tester" },
          tags: [{ tag: { id: "t1", name: "bug" } }],
        },
      ])

    const req = new Request(
      "http://localhost/api/requirements?workspaceId=00000000-0000-0000-0000-000000000000&view=board"
    )
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.degraded).toBe(true)
    expect(json.requirements[0].order).toBe(0)
    expect(json.requirements[0].tags[0].name).toBe("bug")
  })

  it("returns 400 when workspaceId missing", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({ id: "m1" })
    const req = new Request("http://localhost/api/requirements")
    const res = await GET(req as any)
    expect(res.status).toBe(400)
  })

  it("returns 401 when unauthenticated", async () => {
    ;(getServerSession as any).mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/requirements?workspaceId=00000000-0000-0000-0000-000000000000")
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })

  it("returns 403 when not a member", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/requirements?workspaceId=00000000-0000-0000-0000-000000000000")
    const res = await GET(req as any)
    expect(res.status).toBe(403)
  })

  it("rejects invalid create body", async () => {
    const req = new Request("http://localhost/api/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it("creates requirement when authorized", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({ id: "m1" })
    prismaMock.requirement.create.mockResolvedValueOnce({
      id: "r1",
      title: "t",
      description: null,
      priority: "MEDIUM",
      status: "BACKLOG",
      tags: [],
      assignee: null,
      createdBy: { id: "u1", username: "tester" },
    })

    const req = new Request("http://localhost/api/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "00000000-0000-0000-0000-000000000000",
        title: "t",
      }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(201)
    expect(prismaMock.requirement.create).toHaveBeenCalled()
  })

  it("degrades on create when sort_order column is missing", async () => {
    prismaMock.workspaceMember.findFirst.mockResolvedValueOnce({ id: "m1" })
    prismaMock.requirement.create
      .mockRejectedValueOnce({ code: "P2022", message: "The column `fast_json.requirements.sort_order` does not exist" })
      .mockResolvedValueOnce({
        id: "r2",
        workspaceId: "w1",
        title: "t2",
        description: null,
        priority: "MEDIUM",
        status: "BACKLOG",
        assigneeId: null,
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: null,
        createdBy: { id: "u1", username: "tester" },
        tags: [{ tag: { id: "t1", name: "bug" } }],
      })

    const req = new Request("http://localhost/api/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "00000000-0000-0000-0000-000000000000",
        title: "t2",
      }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.degraded).toBe(true)
    expect(json.requirement.order).toBe(0)
  })
})

