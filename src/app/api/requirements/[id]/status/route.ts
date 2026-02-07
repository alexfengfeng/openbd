import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 更新状态验证 schema
const UpdateStatusSchema = z.object({
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE']),
});

// PATCH /api/requirements/[id]/status
export async function PATCH(
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
    const result = UpdateStatusSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // 获取原需求以验证权限
    const existing = await prisma.requirement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // 验证权限
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: existing.workspaceId,
        userId: session.user.id,
        role: {
          in: ['OWNER', 'ADMIN', 'MEMBER'],
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 更新需求状态
    const requirement = await prisma.requirement.update({
      where: { id },
      data: {
        status: result.data.status,
      },
      include: {
        assignee: {
          select: { id: true, username: true },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    const formatted = {
      ...requirement,
      tags: requirement.tags.map((rt) => rt.tag),
    };

    return NextResponse.json({ requirement: formatted });
  } catch (error) {
    console.error('Error updating requirement status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
