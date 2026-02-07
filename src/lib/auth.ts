import { prisma } from './prisma';
import { signToken, verifyAuth, type JWTPayload } from './jwt';

export { signToken, verifyAuth };
export type { JWTPayload };

// 从请求头获取用户信息
export async function getServerSession(): Promise<{ user: { id: string; username: string } } | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyAuth(token);

    // 从数据库获取最新用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true },
    });

    if (!user) {
      return null;
    }

    return { user };
  } catch (error) {
    return null;
  }
}

// 验证密码
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
}

// 哈希密码
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}
