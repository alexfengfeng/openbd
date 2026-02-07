import { describe, expect, it } from "vitest"

import { applyDrag, createEmptyBoardState } from "./dragLogic"

describe("dragLogic", () => {
  it("moves item within the same column", () => {
    const state = createEmptyBoardState()
    state.BACKLOG = [
      { id: "a", status: "BACKLOG", order: 0 },
      { id: "b", status: "BACKLOG", order: 1 },
    ]
    const res = applyDrag(state, "b", "a")
    expect(res?.next.BACKLOG.map((r) => r.id)).toEqual(["b", "a"])
    expect(res?.updates.length).toBeGreaterThan(0)
  })

  it("moves item to another column via column target", () => {
    const state = createEmptyBoardState()
    state.BACKLOG = [{ id: "a", status: "BACKLOG", order: 0 }]
    state.DONE = []
    const res = applyDrag(state, "a", "column:DONE")
    expect(res?.next.BACKLOG.length).toBe(0)
    expect(res?.next.DONE.map((r) => r.id)).toEqual(["a"])
    expect(res?.updates.some((u) => u.status === "DONE")).toBe(true)
  })
})

