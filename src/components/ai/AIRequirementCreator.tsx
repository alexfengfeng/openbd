'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { getPriorityLabel, getStatusLabel } from '@/lib/utils';
import { VoiceInput } from '@/components/requirements/VoiceInput';

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
  const [error, setError] = useState<string | null>(null);
  const [tagTemplateId, setTagTemplateId] = useState<string>('NONE');
  const [tagTemplates, setTagTemplates] = useState<any[]>([]);

  // 加载标签模板
  useEffect(() => {
    fetchTagTemplates();
  }, [workspaceId]);

  const fetchTagTemplates = async () => {
    try {
      const response = await fetch(`/api/tag-templates?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setTagTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching tag templates:', error);
    }
  };

  const handleParse = async () => {
    if (!prompt.trim()) return;

    setError(null);
    setParsing(true);
    try {
      const response = await fetch('/api/ai/parse-requirement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          tagTemplateId: tagTemplateId !== 'NONE' ? tagTemplateId : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setParsed(data.parsed);
        return;
      }
      const data = await response.json().catch(() => null);
      setError(data?.error || 'AI 解析失败');
    } catch (error) {
      console.error('Error parsing requirement:', error);
      setError('AI 解析失败');
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = async () => {
    if (!parsed) return;

    setError(null);
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
        return;
      }
      const data = await response.json().catch(() => null);
      setError(data?.error || '创建失败');
    } catch (error) {
      console.error('Error creating requirement:', error);
      setError('创建失败');
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
          AI 智能创建需求
        </CardTitle>
        <CardDescription>
          选择 AI 标签模板快速填写，或手动输入需求描述
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {!parsed ? (
          <>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between mb-3">
              <Select
                value={tagTemplateId}
                onValueChange={(value) => {
                  setTagTemplateId(value);
                  const tpl = tagTemplates.find((t) => t.id === value);
                  if (tpl) setPrompt(tpl.prompt);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="选择模板..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">手动输入</SelectItem>
                  {tagTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <VoiceInput onText={(text) => setPrompt(text)} />
            </div>
            <Textarea
              placeholder="例如：修复登录页面的 bug，这个问题很紧急，需要在明天之前完成 #bug"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={20}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleParse();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {tagTemplateId !== 'NONE' ? (
                  <>✨ 已选择 "{tagTemplates.find(t => t.id === tagTemplateId)?.name || ''}" 模板</>
                ) : (
                  <>提示：选择模板可快速填充，AI 将按模板标准识别标签</>
                )}
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
