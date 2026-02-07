type Entry<T> = { value: T; expiresAt: number }

const store: Map<string, Entry<unknown>> = ((globalThis as any).__aiCacheStore ??= new Map<
  string,
  Entry<unknown>
>())

function cleanup(now: number) {
  if (store.size <= 5_000) return
  for (const [k, v] of store.entries()) {
    if (v.expiresAt <= now) store.delete(k)
  }
}

export function aiCacheGet<T>(key: string): T | undefined {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry) return undefined
  if (entry.expiresAt <= now) {
    store.delete(key)
    return undefined
  }
  return entry.value as T
}

export function aiCacheSet<T>(key: string, value: T, ttlMs: number) {
  const now = Date.now()
  cleanup(now)
  store.set(key, { value, expiresAt: now + ttlMs })
}

