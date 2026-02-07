import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// POST /api/ai/parse-requirement
// 使用 AI 解析自然语言需求描述，返回结构化数据
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // MVP: 使用简单的关键词解析
    // 后续可以集成 OpenAI API 进行更智能的解析
    const parsed = parseRequirementPrompt(prompt);

    return NextResponse.json({ parsed });
  } catch (error) {
    console.error('Error parsing requirement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 简单的关键词解析（MVP 阶段）
function parseRequirementPrompt(prompt: string) {
  type Priority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

  const result: {
    title: string;
    description: string;
    priority: Priority;
    status: 'BACKLOG';
    tags: string[];
  } = {
    title: prompt.slice(0, 100),
    description: prompt,
    priority: 'MEDIUM',
    status: 'BACKLOG',
    tags: [],
  };

  // 解析优先级关键词
  const priorityKeywords: Record<string, Priority> = {
    'urg': 'URGENT',
    'urgent': 'URGENT',
    '紧急': 'URGENT',
    '高': 'HIGH',
    'high': 'HIGH',
    '中': 'MEDIUM',
    'medium': 'MEDIUM',
    '低': 'LOW',
    'low': 'LOW',
  };

  for (const [keyword, priority] of Object.entries(priorityKeywords)) {
    if (prompt.toLowerCase().includes(keyword)) {
      result.priority = priority;
      break;
    }
  }

  // 解析标签（提取 #tag 格式）
  const tagMatches = prompt.match(/#(\w+)/g);
  if (tagMatches) {
    result.tags = tagMatches.map((tag) => tag.slice(1));
  }

  // 提取标题（取第一行或前100字符）
  const lines = prompt.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    result.title = lines[0].slice(0, 100);
  }

  return result;
}
