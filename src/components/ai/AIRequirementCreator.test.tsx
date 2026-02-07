import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import { AIRequirementCreator } from "./AIRequirementCreator"

const refresh = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}))

describe("AIRequirementCreator", () => {
  beforeEach(() => {
    refresh.mockReset()
  })

  it("renders template selector and parse button", () => {
    render(<AIRequirementCreator workspaceId="w1" />)
    expect(screen.getByText("AI 智能创建")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "AI 解析" })).toBeDisabled()
  })

  it("parses and creates requirement", async () => {
    const fetchMock = vi.fn(async (url: string, init?: any) => {
      if (url === "/api/ai/parse-requirement") {
        return {
          ok: true,
          json: async () => ({
            parsed: {
              title: "标题",
              description: "描述",
              priority: "MEDIUM",
              status: "BACKLOG",
              tags: [],
            },
          }),
        }
      }
      if (url === "/api/requirements" && init?.method === "POST") {
        return { ok: true, json: async () => ({ requirement: { id: "r1" } }) }
      }
      return { ok: false, json: async () => ({}) }
    })
    ;(globalThis as any).fetch = fetchMock

    render(<AIRequirementCreator workspaceId="w1" />)

    fireEvent.change(screen.getByPlaceholderText(/例如：修复登录页面/), { target: { value: "x" } })
    fireEvent.click(screen.getByRole("button", { name: "AI 解析" }))

    await waitFor(() => {
      expect(screen.getByText("确认创建")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("确认创建"))
    await waitFor(() => {
      expect(refresh).toHaveBeenCalled()
    })
  })

  it("applies template to prompt", async () => {
    render(<AIRequirementCreator workspaceId="w1" />)
    fireEvent.click(screen.getByRole("combobox"))
    await waitFor(() => {
      expect(screen.getByText("Bug 修复")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText("Bug 修复"))
    const textarea = screen.getByPlaceholderText(/例如：修复登录页面/) as HTMLTextAreaElement
    await waitFor(() => {
      expect(textarea.value).toContain("【问题现象】")
    })
  })
})

