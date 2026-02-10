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

  /**
   * 根据标签模板优化需求描述
   * @param description 原始描述
   * @param tagTemplatePrompts 标签模板的 prompt 数组
   * @returns 优化后的描述
   */
  async optimizeDescription(description: string, tagTemplatePrompts: string[]): Promise<string> {
    let systemPrompt = '你是需求描述优化助手。请优化用户的需求描述，使其更加清晰、完整、专业。\n\n优化要求：\n1. 保留描述的核心信息和标题\n2. 补充缺失的细节（如背景、目标、验收标准等）\n3. 修正模糊或不准确的表达\n4. 使用结构化的格式（如分段、列表）\n5. 保持简洁专业，避免冗余\n\n只返回优化后的描述文本。'

    if (tagTemplatePrompts.length > 0) {
      const combinedTemplates = tagTemplatePrompts.join('\n\n---\n\n')
      systemPrompt = `你是需求描述优化助手。请根据以下标签模板的指导原则优化需求描述。

标签模板参考：
${combinedTemplates}

优化要求：
1. 保留描述的核心信息和标题
2. 按照标签模板的指导原则补充缺失的细节
3. 修正模糊或不准确的表达
4. 使用结构化的格式（如分段、列表）
5. 保持简洁专业，避免冗余

只返回优化后的描述文本。`
    }

    const completion = await this.client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: description },
      ],
    })

    return (completion.choices?.[0]?.message?.content || description).trim()
  }
}

