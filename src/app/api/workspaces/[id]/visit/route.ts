import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function isMissingColumnError(error: unknown, columnName: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as any).code === 'P2022' &&
    String((error as any).message || '').includes(columnName)
  );
}

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

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: id,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      await prisma.workspace.update({
        where: { id },
        data: { lastVisitedAt: new Date() },
        select: { id: true },
      });
    } catch (error) {
      if (!isMissingColumnError(error, 'last_visited_at')) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating visit time:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

