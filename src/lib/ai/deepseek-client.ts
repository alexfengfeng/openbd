import OpenAI from "openai"

export type ParsedRequirement = {
  title: string
  description: string
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW"
  status: "BACKLOG" | "TODO" | "IN_PROGRESS"
  tags: string[]
}

export class DeepSeekClient {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    })
  }

  async parseRequirement(prompt: string, tagTemplatePrompt?: string): Promise<ParsedRequirement> {
    let systemPrompt = '你是需求分析助手。把用户输入解析为 JSON 对象：{"title":"不超过50字","description":"详细描述","priority":"URGENT/HIGH/MEDIUM/LOW","status":"BACKLOG/TODO/IN_PROGRESS","tags":["标签1","标签2"]}。只返回 JSON。';

    if (tagTemplatePrompt) {
      systemPrompt = `你是需求分析助手。把用户输入解析为 JSON 对象：{"title":"不超过50字","description":"详细描述","priority":"URGENT/HIGH/MEDIUM/LOW","status":"BACKLOG/TODO/IN_PROGRESS","tags":["标签1","标签2"]}。

标签识别参考以下模板：
${tagTemplatePrompt}

请严格按照模板的判断标准来识别标签。只返回 JSON。`;
    }

    const completion = await this.client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    })

    const content = completion.choices?.[0]?.message?.content || "{}"
    return JSON.parse(content)
  }

  async suggestTitle(description: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "根据描述生成简洁的需求标题（不超过50字），只返回标题文本。" },
        { role: "user", content: description },
      ],
    })

    return (completion.choices?.[0]?.message?.content || "").trim()
  }
}

