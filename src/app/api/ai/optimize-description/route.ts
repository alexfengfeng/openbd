import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { DeepSeekClient } from '@/lib/ai/deepseek-client';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 请求体验证 schema
const OptimizeDescriptionSchema = z.object({
  description: z.string().min(1).max(10000),
  tagIds: z.array(z.string().uuid()).optional().default([]),
  workspaceId: z.string().uuid(),
});

// POST /api/ai/optimize-description
// 使用 AI 根据标签模板优化需求描述
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // 验证请求体
    const result = OptimizeDescriptionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data', details: result.error }, { status: 400 });
    }

    const { description, tagIds, workspaceId } = result.data;

    // 验证工作空间权限
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 速率限制
    const rl = rateLimit({
      key: `ai:optimize:${session.user.id}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too Many Requests', resetAt: rl.resetAt },
        { status: 429 }
      );
    }

    // 获取标签对应的模板
    let tagTemplatePrompts: string[] = [];
    if (tagIds.length > 0) {
      // 查询标签对应的模板
      // 注意：这里假设标签名称与模板名称有对应关系
      // 如果需要直接关联，需要修改数据模型
      const tags = await prisma.tag.findMany({
        where: {
          id: { in: tagIds },
          workspaceId,
        },
        select: { name: true },
      });

      const tagNames = tags.map((t) => t.name);

      // 查找匹配的模板（通过名称）
      if (tagNames.length > 0) {
        const templates = await prisma.tagTemplate.findMany({
          where: {
            workspaceId,
            name: { in: tagNames },
          },
          select: { prompt: true },
        });

        tagTemplatePrompts = templates.map((t) => t.prompt);
      }
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      // 降级：返回原始描述
      return NextResponse.json({ optimized: description, degraded: true });
    }

    const client = new DeepSeekClient(apiKey);
    let optimized: string;
    try {
      optimized = await client.optimizeDescription(description, tagTemplatePrompts);
    } catch {
      // 降级：返回原始描述
      return NextResponse.json({ optimized: description, degraded: true });
    }

    return NextResponse.json({ optimized: optimized });
  } catch (error) {
    console.error('Error optimizing description:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
