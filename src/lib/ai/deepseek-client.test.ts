import { describe, expect, it, vi } from "vitest"

const create = vi.fn(async () => ({
  choices: [{ message: { content: '{"title":"t","description":"d","priority":"MEDIUM","status":"BACKLOG","tags":[]}' } }],
}))

const suggest = vi.fn(async () => ({
  choices: [{ message: { content: "标题" } }],
}))

vi.mock("openai", () => {
  return {
    default: class OpenAI {
      chat = {
        completions: {
          create: (args: any) => {
            if (args?.response_format) return create(args)
            return suggest(args)
          },
        },
      }
      constructor(public config: any) {}
    },
  }
})

import { DeepSeekClient } from "./deepseek-client"

describe("DeepSeekClient", () => {
  it("parses requirement via chat completions", async () => {
    const client = new DeepSeekClient("k")
    const res = await client.parseRequirement("x")
    expect(res.title).toBe("t")
    expect(create).toHaveBeenCalled()
  })

  it("suggests title", async () => {
    const client = new DeepSeekClient("k")
    const title = await client.suggestTitle("desc")
    expect(title).toBe("标题")
    expect(suggest).toHaveBeenCalled()
  })
})

