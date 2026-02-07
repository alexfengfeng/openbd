import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function isMissingColumnError(error: unknown, columnName: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as any).code === "P2022" &&
    String((error as any).message || "").includes(columnName)
  )
}

const ReorderSchema = z.object({
  workspaceId: z.string().uuid(),
  updates: z
    .array(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "DONE"]).optional(),
        order: z.number().int().min(0).max(1_000_000),
      })
    )
    .min(1)
    .max(500),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = ReorderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const { workspaceId, updates } = parsed.data

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
        role: { in: ["OWNER", "ADMIN", "MEMBER"] },
      },
      select: { id: true },
    })

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const ids = updates.map((u) => u.id)
    const existing = await prisma.requirement.findMany({
      where: { id: { in: ids }, workspaceId },
      select: { id: true },
    })

    if (existing.length !== ids.length) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 })
    }

    try {
      await prisma.$transaction(
        updates.map((u) =>
          prisma.requirement.update({
            where: { id: u.id },
            data: {
              status: u.status,
              order: u.order,
            },
            select: { id: true },
          })
        )
      )
    } catch (error) {
      if (!isMissingColumnError(error, "sort_order")) throw error
      await prisma.$transaction(
        updates.map((u) =>
          prisma.requirement.update({
            where: { id: u.id },
            data: {
              status: u.status,
            },
            select: { id: true },
          })
        )
      )
      return NextResponse.json({ success: true, degraded: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering requirements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

