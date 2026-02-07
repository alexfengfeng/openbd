import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"

import { getServerSession } from "@/lib/auth"
import { rateLimit } from "@/lib/rateLimit"
import { aiCacheGet, aiCacheSet } from "@/lib/ai/cache"
import { DeepSeekClient } from "@/lib/ai/deepseek-client"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const description = body?.description
    if (typeof description !== "string" || description.trim().length === 0 || description.length > 10_000) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const rl = rateLimit({
      key: `ai:title:${session.user.id}`,
      limit: 20,
      windowMs: 60_000,
    })
    if (!rl.ok) {
      return NextResponse.json({ error: "Too Many Requests", resetAt: rl.resetAt }, { status: 429 })
    }

    const normalized = description.trim()
    const cacheKey = `ai:title:${createHash("sha256").update(normalized).digest("hex")}`
    const cached = aiCacheGet<string>(cacheKey)
    if (cached) {
      return NextResponse.json({ title: cached, cached: true })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      const title = fallbackTitle(normalized)
      aiCacheSet(cacheKey, title, 30 * 60_000)
      return NextResponse.json({ title, degraded: true })
    }

    const client = new DeepSeekClient(apiKey)
    let title: string
    try {
      title = await client.suggestTitle(normalized)
    } catch {
      title = fallbackTitle(normalized)
      aiCacheSet(cacheKey, title, 30 * 60_000)
      return NextResponse.json({ title, degraded: true })
    }

    const safe = title.trim().slice(0, 50) || fallbackTitle(normalized)
    aiCacheSet(cacheKey, safe, 30 * 60_000)
    return NextResponse.json({ title: safe })
  } catch (error) {
    console.error("AI suggest title error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function fallbackTitle(text: string) {
  const firstLine = text.split("\n").find((l) => l.trim())?.trim() ?? ""
  return (firstLine || text).slice(0, 50)
}

