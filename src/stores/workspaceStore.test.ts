import { describe, expect, it, vi, beforeEach } from "vitest"

import { useWorkspaceStore, type WorkspaceSummary } from "./workspaceStore"

const ws = (id: string, name: string): WorkspaceSummary => ({ id, name, slug: name })

describe("workspaceStore", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      workspaces: [],
      currentWorkspace: null,
      recentWorkspaces: [],
      isLoading: false,
    })
    ;(globalThis as any).fetch = vi.fn(() => Promise.resolve({ ok: true }))
  })

  it("keeps recent list unique and limited", () => {
    const store = useWorkspaceStore.getState()
    store.addToRecent("a")
    store.addToRecent("b")
    store.addToRecent("a")
    expect(useWorkspaceStore.getState().recentWorkspaces).toEqual(["a", "b"])
  })

  it("resolves recent workspaces from list", () => {
    useWorkspaceStore.getState().setWorkspaces([ws("a", "A"), ws("b", "B")])
    useWorkspaceStore.getState().addToRecent("b")
    useWorkspaceStore.getState().addToRecent("a")
    const recent = useWorkspaceStore.getState().getRecentWorkspaces()
    expect(recent.map((r) => r.id)).toEqual(["a", "b"])
  })

  it("sets current workspace and triggers visit call", () => {
    const f = vi.fn(() => Promise.resolve({ ok: true }))
    ;(globalThis as any).fetch = f
    useWorkspaceStore.getState().setCurrentWorkspace(ws("a", "A"))
    expect(useWorkspaceStore.getState().currentWorkspace?.id).toBe("a")
    expect(f).toHaveBeenCalledWith("/api/workspaces/a/visit", { method: "POST" })
  })
})

