import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, fireEvent, waitFor } from "@testing-library/react"

import { useWorkspaceStore } from "@/stores/workspaceStore"
import { GlobalHotkeys } from "./GlobalHotkeys"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/workspaces/w1/requirements",
}))

describe("GlobalHotkeys", () => {
  beforeEach(() => {
    push.mockReset()
    useWorkspaceStore.setState({
      workspaces: [{ id: "w1", name: "空间", slug: "w1" }],
      currentWorkspace: { id: "w1", name: "空间", slug: "w1" },
      recentWorkspaces: ["w1"],
      isLoading: false,
    })
  })

  it("navigates to new requirement on C", () => {
    render(<GlobalHotkeys />)
    fireEvent.keyDown(document, { key: "c" })
    return waitFor(() => {
      expect(push).toHaveBeenCalledWith("/workspaces/w1/requirements/new")
    })
  })

  it("focuses search on / and switches recent on mod+1", async () => {
    const input = document.createElement("input")
    input.setAttribute("placeholder", "搜索需求...")
    document.body.appendChild(input)

    render(<GlobalHotkeys />)
    fireEvent.keyDown(document, { key: "/" })
    expect(document.activeElement).toBe(input)

    fireEvent.keyDown(document, { key: "1", ctrlKey: true })
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/workspaces/w1/requirements")
    })
  })
})

