'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { getPriorityLabel, getStatusLabel } from '@/lib/utils';

interface AIRequirementCreatorProps {
  workspaceId: string;
  onCreate?: (requirement: any) => void;
}

export function AIRequirementCreator({ workspaceId, onCreate }: AIRequirementCreatorProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [parsed, setParsed] = useState<any>(null);
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleParse = async () => {
    if (!prompt.trim()) return;

    setParsing(true);
    try {
      const response = await fetch('/api/ai/parse-requirement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        setParsed(data.parsed);
      }
    } catch (error) {
      console.error('Error parsing requirement:', error);
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = async () => {
    if (!parsed) return;

    setCreating(true);
    try {
      const response = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          title: parsed.title,
          description: parsed.description,
          priority: parsed.priority,
          status: parsed.status,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onCreate?.(data.requirement);
        setPrompt('');
        setParsed(null);
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating requirement:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleReset = () => {
    setParsed(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          AI 智能创建
        </CardTitle>
        <CardDescription>
          用自然语言描述你的需求，AI 会帮你自动解析
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!parsed ? (
          <>
            <Textarea
              placeholder="例如：修复登录页面的 bug，这个问题很紧急，需要在明天之前完成 #bug"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleParse();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                提示：使用 #标签 可以添加标签，按 Ctrl+Enter 快速解析
              </span>
              <Button
                onClick={handleParse}
                disabled={!prompt.trim() || parsing}
                size="sm"
              >
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI 解析
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">标题</label>
                <p className="font-semibold">{parsed.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">描述</label>
                <p className="text-sm whitespace-pre-wrap">{parsed.description}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={getPriorityColor(parsed.priority)}>
                  {getPriorityLabel(parsed.priority)}
                </Badge>
                <Badge className={getStatusColor(parsed.status)}>
                  {getStatusLabel(parsed.status)}
                </Badge>
              </div>
              {parsed.tags && parsed.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">标签</label>
                  <div className="flex gap-1 mt-1">
                    {parsed.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline">#{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating} className="flex-1">
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    确认创建
                  </>
                )}
              </Button>
              <Button onClick={handleReset} variant="outline" disabled={creating}>
                重新编辑
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    URGENT: 'text-red-600 bg-red-50 border-red-200',
    HIGH: 'text-orange-600 bg-orange-50 border-orange-200',
    MEDIUM: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    LOW: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return colors[priority] || colors.MEDIUM;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DONE: 'text-green-600 bg-green-50 border-green-200',
    IN_PROGRESS: 'text-blue-600 bg-blue-50 border-blue-200',
    TODO: 'text-purple-600 bg-purple-50 border-purple-200',
    BACKLOG: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return colors[status] || colors.BACKLOG;
}
