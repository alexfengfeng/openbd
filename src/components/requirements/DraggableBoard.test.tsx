import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"

import { DraggableBoard } from "./DraggableBoard"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

describe("DraggableBoard", () => {
  beforeEach(() => {
    ;(globalThis as any).fetch = vi.fn(async (url: string) => {
      if (url === "/api/requirements/r1") {
        return {
          ok: true,
          json: async () => ({ requirement: { id: "r1", title: "需求1-改", status: "BACKLOG", priority: "MEDIUM", tags: [] } }),
        }
      }
      if (url.includes("/api/requirements")) {
        return {
          ok: true,
          json: async () => ({
            requirements: [
              { id: "r1", title: "需求1", description: "", status: "BACKLOG", priority: "MEDIUM", order: 0, updatedAt: new Date().toISOString(), tags: [] },
              { id: "r2", title: "需求2", description: "", status: "DONE", priority: "HIGH", order: 0, updatedAt: new Date().toISOString(), tags: [] },
            ],
          }),
        }
      }
      return { ok: true, json: async () => ({}) }
    })
  })

  it("renders columns and items", async () => {
    render(<DraggableBoard workspaceId="w1" />)
    await waitFor(() => {
      expect(screen.getByText("需求1")).toBeInTheDocument()
    })
    expect(screen.getByRole("heading", { name: "待办" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "已完成" })).toBeInTheDocument()
  })

  it("updates state when quick edit saves", async () => {
    render(<DraggableBoard workspaceId="w1" />)
    await waitFor(() => {
      expect(screen.getByText("需求1")).toBeInTheDocument()
    })

    const button = document.querySelector('[data-quick-edit-button="true"]') as HTMLButtonElement
    button.click()
    await waitFor(() => {
      expect(screen.getByText("保存更改")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText("保存更改"))

    await waitFor(() => {
      expect(screen.getByText("需求1-改")).toBeInTheDocument()
    })
  })
})

