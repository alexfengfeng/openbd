import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 创建标签模板验证 schema
const CreateTagTemplateSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(100),
  prompt: z.string().min(1).max(5000),
});

// GET /api/tag-templates?workspaceId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // 验证权限
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const templates = await prisma.tagTemplate.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching tag templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tag-templates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // 验证请求体
    const result = CreateTagTemplateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const { workspaceId, name, prompt } = result.data;

    // 验证权限
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
        role: {
          in: ['OWNER', 'ADMIN', 'MEMBER'],
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const template = await prisma.tagTemplate.create({
      data: {
        workspaceId,
        name: name.trim(),
        prompt: prompt.trim(),
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating tag template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
