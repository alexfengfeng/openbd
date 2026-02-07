import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ImportSchema = z.object({
  workspaceId: z.string().uuid(),
  requirements: z
    .array(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(10_000).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "DONE"]).optional(),
        tags: z.array(z.string().min(1).max(50)).optional(),
      })
    )
    .min(1)
    .max(100),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = ImportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const { workspaceId, requirements } = parsed.data

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

    const tagNames = Array.from(
      new Set(
        requirements
          .flatMap((r) => r.tags || [])
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 500)
      )
    )

    const existingTags = await prisma.tag.findMany({
      where: { workspaceId, name: { in: tagNames } },
      select: { id: true, name: true },
    })

    const existingByName = new Map(existingTags.map((t) => [t.name, t.id]))
    const toCreate = tagNames.filter((n) => !existingByName.has(n))

    if (toCreate.length > 0) {
      const created = await prisma.$transaction(
        toCreate.map((name) =>
          prisma.tag.create({
            data: { workspaceId, name },
            select: { id: true, name: true },
          })
        )
      )
      for (const t of created) existingByName.set(t.name, t.id)
    }

    const results: { index: number; id?: string; error?: string }[] = []

    for (let i = 0; i < requirements.length; i++) {
      const r = requirements[i]
      try {
        const tagIds =
          r.tags?.map((t) => existingByName.get(t.trim())).filter(Boolean) as string[] | undefined

        const created = await prisma.requirement.create({
          data: {
            workspaceId,
            title: r.title,
            description: r.description,
            priority: r.priority || "MEDIUM",
            status: r.status || "BACKLOG",
            createdById: session.user.id,
            tags: tagIds && tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
          },
          select: { id: true },
        })
        results.push({ index: i, id: created.id })
      } catch (e: any) {
        results.push({ index: i, error: "Create failed" })
      }
    }

    const createdCount = results.filter((r) => r.id).length
    const failedCount = results.filter((r) => r.error).length

    return NextResponse.json({ createdCount, failedCount, results })
  } catch (error) {
    console.error("Error importing requirements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

