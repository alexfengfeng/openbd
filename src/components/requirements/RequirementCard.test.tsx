import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import { RequirementCard } from "./RequirementCard"

describe("RequirementCard", () => {
  it("opens quick edit dialog from action button", async () => {
    render(
      <RequirementCard
        requirement={{
          id: "r1",
          title: "标题",
          description: "描述",
          status: "BACKLOG",
          priority: "MEDIUM",
          tags: [],
        }}
        showActions
      />
    )

    const button = document.querySelector('[data-quick-edit-button="true"]') as HTMLButtonElement
    expect(button).toBeTruthy()
    fireEvent.click(button)
    expect(await screen.findByText("快速编辑需求")).toBeInTheDocument()
  })

  it("saves updates and calls onUpdated", async () => {
    const updated = vi.fn()
    ;(globalThis as any).fetch = vi.fn(async (url: string, init?: any) => {
      if (url.startsWith("/api/requirements/") && init?.method === "PUT") {
        return { ok: true, json: async () => ({ requirement: { id: "r1", title: "新标题" } }) }
      }
      if (url === "/api/ai/suggest-title") {
        return { ok: true, json: async () => ({ title: "AI标题" }) }
      }
      return { ok: false, json: async () => ({}) }
    })

    render(
      <RequirementCard
        requirement={{
          id: "r1",
          title: "标题",
          description: "描述",
          status: "BACKLOG",
          priority: "MEDIUM",
          tags: [],
        }}
        showActions
        onUpdated={updated}
      />
    )

    const button = document.querySelector('[data-quick-edit-button="true"]') as HTMLButtonElement
    fireEvent.click(button)
    await screen.findByText("快速编辑需求")

    fireEvent.click(screen.getByText("AI 优化"))
    await waitFor(() => {
      expect((screen.getByPlaceholderText("需求标题") as HTMLInputElement).value).toBe("AI标题")
    })

    fireEvent.change(screen.getByPlaceholderText("需求标题"), { target: { value: "新标题" } })
    fireEvent.click(screen.getByText("保存更改"))

    await waitFor(() => {
      expect(updated).toHaveBeenCalledWith(expect.objectContaining({ title: "新标题" }))
    })
  })

  it("renders optional fields and can hide actions", () => {
    render(
      <RequirementCard
        requirement={{
          id: "r2",
          title: "标题2",
          description: null,
          status: "DONE",
          priority: "HIGH",
          tags: [{ id: "t1", name: "tag" }],
          dueDate: new Date().toISOString(),
          assignee: { id: "u2", username: "alice" },
        }}
        showActions={false}
      />
    )
    expect(screen.getByText("标题2")).toBeInTheDocument()
    expect(document.querySelector('[data-quick-edit-button="true"]')).toBeNull()
  })
})

