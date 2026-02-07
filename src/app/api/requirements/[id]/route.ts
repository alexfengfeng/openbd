import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

function isMissingColumnError(error: unknown, columnName: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as any).code === 'P2022' &&
    String((error as any).message || '').includes(columnName)
  );
}

const requirementSelectWithoutOrder = {
  id: true,
  workspaceId: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  assigneeId: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  workspace: { select: { id: true } },
  assignee: { select: { id: true, username: true } },
  createdBy: { select: { id: true, username: true } },
  tags: { select: { tag: true } },
} as const;

const requirementSelectWithoutOrderNoWorkspace = {
  id: true,
  workspaceId: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  assigneeId: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: { id: true, username: true } },
  createdBy: { select: { id: true, username: true } },
  tags: { select: { tag: true } },
} as const;

// 更新需求验证 schema
const UpdateRequirementSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10_000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE']).optional(),
  order: z.number().int().min(0).max(1_000_000).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
});

// GET /api/requirements/[id]
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

    let requirement: any;
    let degraded = false;
    try {
      requirement = await prisma.requirement.findUnique({
        where: { id },
        include: {
          workspace: {
            select: { id: true },
          },
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
    } catch (error) {
      if (!isMissingColumnError(error, 'sort_order')) throw error;
      degraded = true;
      requirement = await prisma.requirement.findUnique({
        where: { id },
        select: requirementSelectWithoutOrder,
      });
    }

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // 验证权限
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: requirement.workspace.id,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formatted = {
      ...requirement,
      tags: requirement.tags.map((rt: any) => rt.tag),
      order: typeof requirement.order === 'number' ? requirement.order : 0,
    };

    return NextResponse.json(degraded ? { requirement: formatted, degraded } : { requirement: formatted });
  } catch (error) {
    console.error('Error fetching requirement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/requirements/[id]
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
    const result = UpdateRequirementSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // 获取原需求以验证权限
    const existing = await prisma.requirement.findUnique({
      where: { id },
      select: { id: true, workspaceId: true },
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

    const { title, description, priority, status, order, assigneeId, dueDate, tagIds } = result.data;

    const data: any = {
      title,
      description,
      priority,
      status,
      assigneeId: assigneeId === null ? null : assigneeId,
      dueDate: dueDate === null ? null : (dueDate ? new Date(dueDate) : null),
      tags: tagIds ? {
        deleteMany: {},
        create: tagIds.map((tagId: string) => ({
          tagId,
        })),
      } : undefined,
    };
    if (typeof order === 'number') data.order = order;

    // 更新需求
    let requirement: any;
    let degraded = false;
    try {
      requirement = await prisma.requirement.update({
        where: { id },
        data,
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
    } catch (error) {
      if (!isMissingColumnError(error, 'sort_order')) throw error;
      degraded = true;
      if ('order' in data) delete data.order;
      requirement = await prisma.requirement.update({
        where: { id },
        data,
        select: requirementSelectWithoutOrderNoWorkspace,
      });
    }

    const formatted = {
      ...requirement,
      tags: requirement.tags.map((rt: any) => rt.tag),
      order: typeof requirement.order === 'number' ? requirement.order : 0,
    };

    return NextResponse.json(degraded ? { requirement: formatted, degraded } : { requirement: formatted });
  } catch (error) {
    console.error('Error updating requirement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/requirements/[id]
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

    // 获取原需求以验证权限
    const existing = await prisma.requirement.findUnique({
      where: { id },
      select: { id: true, workspaceId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // 验证权限（只有所有者和管理员可以删除）
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

    await prisma.requirement.delete({
      where: { id },
    });

    return NextResponse.json({ message: '需求已删除' });
  } catch (error) {
    console.error('Error deleting requirement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
