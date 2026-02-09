import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/workspaces/[id] - 获取工作空间详情
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

    // 验证用户是否有权限访问该工作空间
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: id,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, username: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
          },
          orderBy: {
            role: 'asc',
          },
        },
        tags: {
          orderBy: {
            name: 'asc',
          },
        },
        _count: {
          select: {
            requirements: true,
            members: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/workspaces/[id] - 更新工作空间
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
    const { name } = body;

    // 验证权限（只有所有者和管理员可以编辑）
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: id,
        userId: session.user.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        name: name?.trim(),
      },
      include: {
        owner: {
          select: { id: true, username: true },
        },
      },
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id] - 软删除工作空间及其所有需求
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
    const body = await request.json().catch(() => ({}));
    const { confirmName } = body;

    // 验证权限（所有者和管理员可以删除）
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { id: true, name: true, ownerId: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // 检查是否是所有者
    const isOwner = workspace.ownerId === session.user.id;

    // 如果不是所有者，检查是否是管理员
    if (!isOwner) {
      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: id,
          userId: session.user.id,
          role: 'ADMIN',
        },
      });

      if (!member) {
        return NextResponse.json({ error: '只有所有者和管理员可以删除工作空间' }, { status: 403 });
      }
    }

    // 验证确认名称
    if (!confirmName || confirmName !== workspace.name) {
      return NextResponse.json({ error: '请输入正确的工作空间名称以确认删除' }, { status: 400 });
    }

    // 使用事务同时软删除工作空间和其所有需求
    await prisma.$transaction([
      // 软删除工作空间内的所有需求
      prisma.requirement.updateMany({
        where: {
          workspaceId: id,
          deletedAt: null, // 只删除未被软删除的需求
        },
        data: {
          deletedAt: new Date(),
        },
      }),
      // 软删除工作空间
      prisma.workspace.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: '工作空间已删除', workspaceId: id });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
