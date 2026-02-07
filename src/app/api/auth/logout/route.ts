import { NextResponse } from 'next/server';

// POST /api/auth/logout
export async function POST() {
  const response = NextResponse.json({ message: '登出成功' });

  // 清除 cookie
  response.cookies.delete('auth-token');

  return response;
}
