"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Loader2 } from "lucide-react"

import { DraggableRequirementCard } from "./DraggableRequirementCard"
import { RequirementCard } from "./RequirementCard"
import { applyDrag, createEmptyBoardState, type BoardState, type StatusKey } from "./dragLogic"

const STATUSES = [
  { key: "BACKLOG", label: "待办", color: "bg-gray-100 dark:bg-gray-800" },
  { key: "TODO", label: "待处理", color: "bg-purple-50 dark:bg-purple-950" },
  { key: "IN_PROGRESS", label: "进行中", color: "bg-blue-50 dark:bg-blue-950" },
  { key: "DONE", label: "已完成", color: "bg-green-50 dark:bg-green-950" },
] as const

function Column(props: {
  status: StatusKey
  title: string
  color: string
  count: number
  children: ReactNode
}) {
  const { setNodeRef } = useDroppable({ id: `column:${props.status}` })
  return (
    <div ref={setNodeRef} className={`flex-shrink-0 w-80 ${props.color} rounded-lg p-4 flex flex-col`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{props.title}</h3>
        <span className="text-sm text-muted-foreground">{props.count}</span>
      </div>
      {props.children}
    </div>
  )
}

export function DraggableBoard(props: { workspaceId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<BoardState>(createEmptyBoardState)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeRequirement, setActiveRequirement] = useState<any | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  useEffect(() => {
    const fetchRequirements = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/requirements?workspaceId=${props.workspaceId}&view=board`)
        if (!response.ok) return
        const data = await response.json()
        const list = Array.isArray(data.requirements) ? data.requirements : []
        const next = createEmptyBoardState()
        for (const r of list) {
          const key = (r.status as StatusKey) || "BACKLOG"
          if (next[key]) next[key].push(r)
        }
        for (const s of STATUSES) {
          next[s.key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        }
        setState(next)
      } finally {
        setLoading(false)
      }
    }

    fetchRequirements()
  }, [props.workspaceId])

  const allRequirements = useMemo(() => {
    return STATUSES.flatMap((s) => state[s.key])
  }, [state])

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id)
    setActiveId(id)
    const req = allRequirements.find((r) => r.id === id) ?? null
    setActiveRequirement(req)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    setActiveRequirement(null)

    const active = String(event.active.id)
    const over = event.over ? String(event.over.id) : null
    if (!over) return

    const result = applyDrag(state, active, over)
    if (!result) return

    setState(result.next)

    if (result.updates.length === 0) return

    const response = await fetch("/api/requirements/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: props.workspaceId, updates: result.updates }),
    })

    if (!response.ok) {
      router.refresh()
    }
  }

  const handleUpdated = (updated: any) => {
    setState((prev) => {
      const next = createEmptyBoardState()
      for (const s of STATUSES) {
        next[s.key] = prev[s.key].map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
      }
      const from = STATUSES.map((s) => s.key).find((k) => next[k].some((r) => r.id === updated.id)) as StatusKey | undefined
      if (from && from !== updated.status) {
        const moved = next[from].find((r) => r.id === updated.id)
        next[from] = next[from].filter((r) => r.id !== updated.id)
        if (moved) next[updated.status as StatusKey].unshift({ ...moved, ...updated })
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {STATUSES.map((column) => {
          const items = state[column.key]
          return (
            <Column
              key={column.key}
              status={column.key}
              title={column.label}
              color={column.color}
              count={items.length}
            >
              <SortableContext items={items.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {items.map((r) => (
                    <DraggableRequirementCard
                      key={r.id}
                      requirement={r}
                      onClick={() => router.push(`/workspaces/${props.workspaceId}/requirements/${r.id}`)}
                      onUpdated={handleUpdated}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                      拖拽需求到这里
                    </div>
                  )}
                </div>
              </SortableContext>
            </Column>
          )
        })}
      </div>

      <DragOverlay>
        {activeId && activeRequirement ? (
          <div className="opacity-90 rotate-2">
            <RequirementCard requirement={activeRequirement} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

