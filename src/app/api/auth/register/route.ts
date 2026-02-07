import { NextRequest, NextResponse } from 'next/server';
import { signToken, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

// 注册请求验证 schema
const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(256),
  email: z.string().email().max(254).optional(),
});

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit({ key: `auth:register:${ip}`, limit: 5, windowMs: 60_000 });
    if (!rl.ok) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }

    const body = await request.json();

    // 验证请求体
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: '用户名至少3个字符，密码至少6个字符' },
        { status: 400 }
      );
    }

    const { username, password, email } = result.data;

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已被使用' },
        { status: 409 }
      );
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: '邮箱已被使用' },
          { status: 409 }
        );
      }
    }

    // 哈希密码
    const passwordHash = await hashPassword(password);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        email,
      },
    });

    // 创建默认工作空间
    const workspace = await prisma.workspace.create({
      data: {
        name: `${username} 的工作空间`,
        slug: `${username.toLowerCase()}-${Date.now().toString(36)}`,
        ownerId: user.id,
      },
    });

    // 添加所有者为成员
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'OWNER',
      },
    });

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
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
    }, { status: 201 });

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
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
