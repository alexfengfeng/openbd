import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { aiCacheGet, aiCacheSet } from '@/lib/ai/cache';
import { DeepSeekClient, type ParsedRequirement } from '@/lib/ai/deepseek-client';
import { createHash } from 'crypto';

// POST /api/ai/parse-requirement
// 使用 AI 解析自然语言需求描述，返回结构化数据
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await request.json();

    if (typeof prompt !== 'string' || prompt.trim().length === 0 || prompt.length > 5000) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const rl = rateLimit({
      key: `ai:parse:${session.user.id}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too Many Requests', resetAt: rl.resetAt },
        { status: 429 }
      );
    }

    const normalized = prompt.trim();
    const cacheKey = `ai:parse:${createHash('sha256').update(normalized).digest('hex')}`;
    const cached = aiCacheGet<ParsedRequirement>(cacheKey);
    if (cached) {
      return NextResponse.json({ parsed: cached, cached: true });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      const fallback = parseRequirementPrompt(normalized);
      aiCacheSet(cacheKey, fallback, 30 * 60_000);
      return NextResponse.json({ parsed: fallback, degraded: true });
    }

    const client = new DeepSeekClient(apiKey);
    let parsed: ParsedRequirement;
    try {
      parsed = await client.parseRequirement(normalized);
    } catch {
      const fallback = parseRequirementPrompt(normalized);
      aiCacheSet(cacheKey, fallback, 30 * 60_000);
      return NextResponse.json({ parsed: fallback, degraded: true });
    }

    const safe = coerceParsedRequirement(parsed, normalized);
    aiCacheSet(cacheKey, safe, 30 * 60_000);
    return NextResponse.json({ parsed: safe });
  } catch (error) {
    console.error('Error parsing requirement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function parseRequirementPrompt(prompt: string): ParsedRequirement {
  const lower = prompt.toLowerCase();

  let priority: ParsedRequirement['priority'] = 'MEDIUM';
  if (/(紧急|urgent|p0|sev0)/i.test(prompt)) priority = 'URGENT';
  else if (/(高|high|p1|sev1)/i.test(prompt)) priority = 'HIGH';
  else if (/(低|low|p3|sev3)/i.test(prompt)) priority = 'LOW';

  let status: ParsedRequirement['status'] = 'BACKLOG';
  if (/(进行中|in progress|wip)/i.test(prompt)) status = 'IN_PROGRESS';
  else if (/(待处理|todo|to do)/i.test(prompt)) status = 'TODO';

  const tags =
    prompt
      .match(/#([\p{L}\p{N}_-]+)/gu)
      ?.map((t) => t.slice(1))
      .slice(0, 10) ?? [];

  const firstLine = prompt.split('\n').find((l) => l.trim())?.trim() ?? '';
  const title = (firstLine || prompt).slice(0, 50);

  return {
    title,
    description: prompt,
    priority,
    status,
    tags,
  };
}

function coerceParsedRequirement(input: any, originalPrompt: string): ParsedRequirement {
  const fallback = parseRequirementPrompt(originalPrompt);
  const title =
    typeof input?.title === 'string' && input.title.trim()
      ? input.title.trim().slice(0, 50)
      : fallback.title;
  const description =
    typeof input?.description === 'string' && input.description.trim()
      ? input.description.trim().slice(0, 10_000)
      : fallback.description;

  const allowedPriority = new Set(['URGENT', 'HIGH', 'MEDIUM', 'LOW']);
  const priority = allowedPriority.has(input?.priority) ? input.priority : fallback.priority;

  const allowedStatus = new Set(['BACKLOG', 'TODO', 'IN_PROGRESS']);
  const status = allowedStatus.has(input?.status) ? input.status : fallback.status;

  const tags =
    Array.isArray(input?.tags)
      ? input.tags.filter((t: any) => typeof t === 'string' && t.trim()).map((t: string) => t.trim().slice(0, 50)).slice(0, 10)
      : fallback.tags;

  return { title, description, priority, status, tags };
}
