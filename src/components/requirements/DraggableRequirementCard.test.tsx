"use client"

import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { DndContext } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { DraggableRequirementCard } from "./DraggableRequirementCard"

describe("DraggableRequirementCard", () => {
  it("renders requirement content", () => {
    render(
      <DndContext>
        <SortableContext items={["r1"]} strategy={verticalListSortingStrategy}>
          <DraggableRequirementCard
            requirement={{ id: "r1", title: "标题", description: "", status: "BACKLOG", priority: "MEDIUM", tags: [] }}
          />
        </SortableContext>
      </DndContext>
    )
    expect(screen.getByText("标题")).toBeInTheDocument()
  })
})

