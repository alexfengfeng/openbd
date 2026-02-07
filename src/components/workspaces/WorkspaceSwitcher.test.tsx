import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import { useWorkspaceStore } from "@/stores/workspaceStore"
import { WorkspaceSwitcher } from "./WorkspaceSwitcher"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/workspaces/old/requirements",
}))

describe("WorkspaceSwitcher", () => {
  beforeEach(() => {
    push.mockReset()
    useWorkspaceStore.setState({
      workspaces: [],
      currentWorkspace: null,
      recentWorkspaces: [],
      isLoading: false,
    })
    ;(globalThis as any).fetch = vi.fn(async (url: string) => {
      if (url === "/api/workspaces") {
        return {
          ok: true,
          json: async () => ({
            workspaces: [
              { id: "old", name: "旧空间", slug: "old" },
              { id: "new", name: "新空间", slug: "new" },
            ],
          }),
        }
      }
      return { ok: true, json: async () => ({}) }
    })
  })

  it("loads workspaces and switches route", async () => {
    render(<WorkspaceSwitcher />)

    await waitFor(() => {
      expect(screen.getByText("旧空间")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("旧空间"))

    await waitFor(() => {
      expect(screen.getByPlaceholderText("搜索工作空间...")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("新空间"))
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/workspaces/new/requirements")
    })
  })

  it("filters by search and supports create workspace", async () => {
    render(<WorkspaceSwitcher />)

    await waitFor(() => {
      expect(screen.getByText("旧空间")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("旧空间"))
    await waitFor(() => {
      expect(screen.getByPlaceholderText("搜索工作空间...")).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText("搜索工作空间..."), { target: { value: "新" } })
    expect(screen.getByText("新空间")).toBeInTheDocument()

    fireEvent.click(screen.getByText("新建工作空间"))
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/workspaces/new")
    })
  })
})

