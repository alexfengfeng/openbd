import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRequirementDeletePermission } from '@/lib/permissions';

// POST /api/requirements/[id]/restore - 恢复已删除的需求
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

    // 验证权限（与删除权限相同：ADMIN 或创建者）
    const permission = await checkRequirementDeletePermission(id, session.user.id);

    if (!permission.allowed) {
      return NextResponse.json(
        { error: '只有管理员和创建者可以恢复需求' },
        { status: 403 }
      );
    }

    // 执行恢复
    const requirement = await prisma.requirement.update({
      where: { id },
      data: { deletedAt: null },
      select: { id: true, title: true },
    });

    return NextResponse.json({
      message: '需求已恢复',
      requirement,
    });
  } catch (error) {
    console.error('Error restoring requirement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
