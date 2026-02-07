export const STATUS_KEYS = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE"] as const

export type StatusKey = (typeof STATUS_KEYS)[number]

export type BoardState = Record<StatusKey, any[]>

export function createEmptyBoardState(): BoardState {
  return {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  }
}

export function findContainer(state: BoardState, id: string): StatusKey | null {
  if (id.startsWith("column:")) {
    const key = id.replace("column:", "")
    return (STATUS_KEYS as readonly string[]).includes(key) ? (key as StatusKey) : null
  }
  for (const status of STATUS_KEYS) {
    if (state[status].some((r) => r.id === id)) return status
  }
  return null
}

export function applyDrag(state: BoardState, activeId: string, overId: string) {
  const sourceStatus = findContainer(state, activeId)
  const destStatus = findContainer(state, overId)
  if (!sourceStatus || !destStatus) return null

  const sourceItems = state[sourceStatus]
  const destItems = state[destStatus]
  const activeIndex = sourceItems.findIndex((r) => r.id === activeId)
  if (activeIndex === -1) return null

  const overIndex = overId.startsWith("column:")
    ? destItems.length
    : destItems.findIndex((r) => r.id === overId)

  if (overIndex === -1 && !overId.startsWith("column:")) return null

  const next = { ...state, [sourceStatus]: [...sourceItems], [destStatus]: [...destItems] } as BoardState
  const [moved] = next[sourceStatus].splice(activeIndex, 1)
  if (!moved) return null
  next[destStatus].splice(overIndex, 0, moved)

  const updates: { id: string; status: StatusKey; order: number }[] = []
  const touched = new Set<StatusKey>([sourceStatus, destStatus])
  for (const s of touched) {
    next[s].forEach((r, idx) => {
      const desired = idx
      const statusChanged = sourceStatus !== destStatus && r.id === moved.id && s === destStatus
      if (r.order !== desired || r.status !== s || statusChanged) {
        updates.push({ id: r.id, status: s, order: desired })
        r.order = desired
        r.status = s
      }
    })
  }

  return { next, updates, sourceStatus, destStatus }
}

