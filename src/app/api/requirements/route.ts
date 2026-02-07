import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 创建需求验证 schema
const CreateRequirementSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(10_000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE']).optional(),
  tagIds: z.array(z.string()).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
});

// GET /api/requirements?workspaceId=xxx&status=xxx&priority=xxx&assigneeId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // 验证用户是否有权限访问该工作空间
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 构建查询条件
    const where: any = { workspaceId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    // 获取需求列表
    const requirements = await prisma.requirement.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, username: true },
        },
        createdBy: {
          select: { id: true, username: true },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // 转换数据格式
    const formatted = requirements.map((req) => ({
      ...req,
      tags: req.tags.map((rt) => rt.tag),
    }));

    return NextResponse.json({ requirements: formatted });
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/requirements
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // 验证请求体
    const result = CreateRequirementSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const { workspaceId, title, description, priority, status, tagIds, assigneeId, dueDate } = result.data;

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

    // 创建需求
    const requirement = await prisma.requirement.create({
      data: {
        workspaceId,
        title,
        description,
        priority: priority || 'MEDIUM',
        status: status || 'BACKLOG',
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: session.user.id,
        tags: tagIds && tagIds.length > 0 ? {
          create: tagIds.map((tagId: string) => ({
            tagId,
          })),
        } : undefined,
      },
      include: {
        assignee: {
          select: { id: true, username: true },
        },
        createdBy: {
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

    return NextResponse.json({ requirement: formatted }, { status: 201 });
  } catch (error) {
    console.error('Error creating requirement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
