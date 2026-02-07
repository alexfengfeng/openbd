import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// GET /api/auth/me
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user: session.user });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}
