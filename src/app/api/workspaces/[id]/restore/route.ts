import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkWorkspacePermission, WORKSPACE_PERMISSIONS } from '@/lib/permissions';

// POST /api/workspaces/[id]/restore - 恢复已删除的工作空间及其需求
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 验证权限（只有 OWNER 和 ADMIN 可以恢复）
    const permission = await checkWorkspacePermission(
      id,
      session.user.id,
      WORKSPACE_PERMISSIONS.DELETE
    );

    if (!permission.allowed) {
      return NextResponse.json(
        { error: '只有所有者和管理员可以恢复工作空间' },
        { status: 403 }
      );
    }

    // 使用事务同时恢复工作空间和其所有被软删除的需求
    const [workspace] = await prisma.$transaction([
      // 恢复工作空间内的所有被软删除的需求
      prisma.requirement.updateMany({
        where: {
          workspaceId: id,
          deletedAt: { not: null }, // 只恢复被软删除的需求
        },
        data: {
          deletedAt: null,
        },
      }),
      // 恢复工作空间
      prisma.workspace.update({
        where: { id },
        data: { deletedAt: null },
        select: { id: true, name: true },
      }),
    ]);

    return NextResponse.json({
      message: '工作空间已恢复',
      workspace,
    });
  } catch (error) {
    console.error('Error restoring workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
