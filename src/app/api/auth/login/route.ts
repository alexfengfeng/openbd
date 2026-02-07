import { NextRequest, NextResponse } from 'next/server';
import { signToken, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

// 登录请求验证 schema
const LoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit({ key: `auth:login:${ip}`, limit: 10, windowMs: 60_000 });
    if (!rl.ok) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }

    const body = await request.json();

    // 验证请求体
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    const { username, password } = result.data;

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 生成 JWT token
    const token = await signToken({
      userId: user.id,
      username: user.username,
    });

    // 创建响应并设置 cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });

    // 设置 httpOnly cookie
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isHttps = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || isHttps,
      sameSite: 'strict',
      priority: 'high',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
