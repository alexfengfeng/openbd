"use client"

import type { CSSProperties } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { RequirementCard } from "./RequirementCard"

export function DraggableRequirementCard(props: {
  requirement: any
  onClick?: () => void
  onUpdated?: (requirement: any) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.requirement.id,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
      onClick={props.onClick}
    >
      <RequirementCard requirement={props.requirement} onUpdated={props.onUpdated} />
    </div>
  )
}

