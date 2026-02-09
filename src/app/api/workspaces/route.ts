import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSlug } from '@/lib/utils';

function isMissingColumnError(error: unknown, columnName: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as any).code === 'P2022' &&
    String((error as any).message || '').includes(columnName)
  );
}

const workspaceSelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: { id: true, username: true },
  },
  members: {
    select: {
      id: true,
      role: true,
      user: {
        select: { id: true, username: true },
      },
    },
  },
  _count: {
    select: {
      requirements: true,
      members: true,
    },
  },
} as const;

// GET /api/workspaces - 获取当前用户的工作空间列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseWhere = {
      members: {
        some: {
          userId: session.user.id,
        },
      },
      deletedAt: null,
    } as const;

    let workspaces;
    try {
      workspaces = await prisma.workspace.findMany({
        where: baseWhere,
        select: workspaceSelect,
        orderBy: [{ lastVisitedAt: 'desc' }, { updatedAt: 'desc' }],
      });
    } catch (error) {
      if (!isMissingColumnError(error, 'last_visited_at')) throw error;
      workspaces = await prisma.workspace.findMany({
        where: baseWhere,
        select: workspaceSelect,
        orderBy: [{ updatedAt: 'desc' }],
      });
    }

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/workspaces - 创建新工作空间
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: '工作空间名称不能为空' }, { status: 400 });
    }

    // 生成唯一 slug
    const slug = generateSlug(name.trim());

    // 创建工作空间
    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        slug,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
      select: workspaceSelect,
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
