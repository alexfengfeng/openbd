export type NavItem = { href: string }

export function computeActiveHref(pathname: string, items: NavItem[]) {
  const matches = items.filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
  let best = ""
  for (const m of matches) {
    if (m.href.length > best.length) best = m.href
  }
  return best || null
}

export function getWorkspaceIdFromPath(pathname: string) {
  const match = pathname.match(/^\/workspaces\/([^/]+)/)
  const raw = match?.[1]
  if (!raw || raw === "new") return null
  return raw
}

