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

function isMissingTableError(error: unknown, tableName: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as any).code === 'P2021' &&
    String((error as any).message || '').includes(tableName)
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
  assignee: {
    select: { id: true, username: true },
  },
  createdBy: {
    select: { id: true, username: true },
  },
  tags: {
    select: {
      tag: true,
    },
  },
} as const;

const requirementSelectNoTags = {
  id: true,
  workspaceId: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  order: true,
  assigneeId: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  assignee: {
    select: { id: true, username: true },
  },
  createdBy: {
    select: { id: true, username: true },
  },
} as const;

const requirementSelectNoTagsWithoutOrder = {
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
  assignee: {
    select: { id: true, username: true },
  },
  createdBy: {
    select: { id: true, username: true },
  },
} as const;

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

// GET /api/requirements?workspaceId=xxx&status=xxx&priority=xxx&assigneeId=xxx&page=1&pageSize=9
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
    const view = searchParams.get('view');
    const page = parseInt(searchParams.get('page') || '1', 10);
    // 看板视图获取所有需求，不分页
    const pageSize = view === 'board' ? 10000 : parseInt(searchParams.get('pageSize') || '9', 10);

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

    // 计算总数
    const total = await prisma.requirement.count({ where });
    const totalPages = Math.ceil(total / pageSize);

    let requirements: any[] = [];
    let degraded = false;
    try {
      requirements = await prisma.requirement.findMany({
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
        orderBy:
          view === 'board'
            ? [{ status: 'asc' }, { order: 'asc' }, { updatedAt: 'desc' }]
            : [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    } catch (error) {
      const missingOrder = isMissingColumnError(error, 'sort_order');
      const missingTags =
        isMissingTableError(error, 'requirement_tags') ||
        isMissingTableError(error, 'tags');
      if (!missingOrder && !missingTags) throw error;
      degraded = true;
      requirements = await prisma.requirement.findMany({
        where,
        select: missingTags
          ? missingOrder
            ? requirementSelectNoTagsWithoutOrder
            : requirementSelectNoTags
          : requirementSelectWithoutOrder,
        orderBy:
          view === 'board'
            ? missingOrder
              ? [{ status: 'asc' }, { updatedAt: 'desc' }]
              : [{ status: 'asc' }, { order: 'asc' }, { updatedAt: 'desc' }]
            : [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    }

    // 转换数据格式
    const formatted = requirements.map((req) => ({
      ...req,
      tags: Array.isArray(req.tags) ? req.tags.map((rt: any) => rt.tag) : [],
      order: typeof req.order === 'number' ? req.order : 0,
    }));

    return NextResponse.json(
      degraded
        ? { requirements: formatted, degraded, pagination: { page, pageSize, total, totalPages } }
        : { requirements: formatted, pagination: { page, pageSize, total, totalPages } }
    );
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

    const data = {
      workspaceId,
      title,
      description,
      priority: priority || 'MEDIUM',
      status: status || 'BACKLOG',
      assigneeId,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: session.user.id,
      tags: tagIds && tagIds.length > 0
        ? {
            create: tagIds.map((tagId: string) => ({
              tagId,
            })),
          }
        : undefined,
    };

    let requirement: any;
    let degraded = false;
    try {
      requirement = await prisma.requirement.create({
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
      const missingOrder = isMissingColumnError(error, 'sort_order');
      const missingTags =
        isMissingTableError(error, 'requirement_tags') ||
        isMissingTableError(error, 'tags');
      if (!missingOrder && !missingTags) throw error;
      degraded = true;
      requirement = await prisma.requirement.create({
        data,
        select: missingTags
          ? missingOrder
            ? requirementSelectNoTagsWithoutOrder
            : requirementSelectNoTags
          : requirementSelectWithoutOrder,
      });
    }

    const formatted = {
      ...requirement,
      tags: Array.isArray(requirement.tags) ? requirement.tags.map((rt: any) => rt.tag) : [],
      order: typeof requirement.order === 'number' ? requirement.order : 0,
    };

    return NextResponse.json(degraded ? { requirement: formatted, degraded } : { requirement: formatted }, { status: 201 });
  } catch (error) {
    console.error('Error creating requirement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
