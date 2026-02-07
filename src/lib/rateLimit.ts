import type { NextRequest } from 'next/server';

type Bucket = { count: number; resetAt: number };

const store: Map<string, Bucket> = ((globalThis as any).__rateLimitStore ??= new Map<string, Bucket>());

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return (request as any).ip || 'unknown';
}

export function rateLimit(params: { key: string; limit: number; windowMs: number }) {
  const now = Date.now();

  if (store.size > 10_000) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= now) store.delete(k);
    }
  }

  const existing = store.get(params.key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + params.windowMs;
    store.set(params.key, { count: 1, resetAt });
    return { ok: true, remaining: Math.max(0, params.limit - 1), resetAt };
  }

  if (existing.count >= params.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: Math.max(0, params.limit - existing.count), resetAt: existing.resetAt };
}

