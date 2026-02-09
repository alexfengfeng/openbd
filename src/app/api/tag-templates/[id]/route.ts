import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 更新标签模板验证 schema
const UpdateTagTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  prompt: z.string().min(1).max(5000).optional(),
});

// GET /api/tag-templates/[id] - 获取单个标签模板
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.tagTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // 验证权限
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: template.workspaceId,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching tag template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/tag-templates/[id] - 更新标签模板
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 验证请求体
    const result = UpdateTagTemplateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // 检查模板是否存在并验证权限
    const existing = await prisma.tagTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: existing.workspaceId,
        userId: session.user.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, prompt } = result.data;

    const template = await prisma.tagTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(prompt !== undefined && { prompt: prompt.trim() }),
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating tag template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tag-templates/[id] - 删除标签模板
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 检查模板是否存在并验证权限
    const existing = await prisma.tagTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: existing.workspaceId,
        userId: session.user.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.tagTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ message: '标签模板已删除' });
  } catch (error) {
    console.error('Error deleting tag template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
