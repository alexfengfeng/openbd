import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen, waitFor } from "@testing-library/react"

import { useWorkspaceStore } from "@/stores/workspaceStore"
import { CommandPalette } from "./CommandPalette"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/workspaces/w1/requirements",
}))

describe("CommandPalette", () => {
  beforeEach(() => {
    push.mockReset()
    useWorkspaceStore.setState({
      workspaces: [{ id: "w1", name: "空间1", slug: "w1" }],
      currentWorkspace: { id: "w1", name: "空间1", slug: "w1" },
      recentWorkspaces: ["w1"],
      isLoading: false,
    })
  })

  it("opens on mod+k", async () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    await waitFor(() => {
      expect(screen.getByPlaceholderText("搜索工作空间、操作...")).toBeInTheDocument()
    })
  })

  it("navigates when selecting a workspace", async () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    await waitFor(() => {
      expect(screen.getByText("空间1")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText("空间1"))
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/workspaces/w1/requirements")
    })
  })

  it("supports create actions", async () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    await waitFor(() => {
      expect(screen.getByText("创建需求")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText("创建工作空间"))
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/workspaces/new")
    })
  })
})

