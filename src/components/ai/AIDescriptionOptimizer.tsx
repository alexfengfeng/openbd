'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, X } from 'lucide-react';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

interface AIDescriptionOptimizerProps {
  /** 当前描述 */
  description: string;
  /** 工作空间 ID */
  workspaceId: string;
  /** 优化完成回调 */
  onOptimized: (optimized: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 按钮尺寸 */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** 按钮变体 */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  /** 自定义按钮文本 */
  buttonText?: string;
  /** 是否显示标签选择器 */
  showTagSelector?: boolean;
}

/**
 * AI 描述优化器组件
 *
 * 支持根据选中的标签对应的标签模板来优化需求描述。
 * 可复用于 AIRequirementCreator 和 QuickEditDialog 等场景。
 */
export function AIDescriptionOptimizer({
  description,
  workspaceId,
  onOptimized,
  disabled = false,
  size = 'sm',
  variant = 'ghost',
  buttonText = 'AI 优化描述',
  showTagSelector = true,
}: AIDescriptionOptimizerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  // 加载工作空间的标签列表
  useEffect(() => {
    if (!showTagSelector) return;
    fetchTags();
  }, [workspaceId, showTagSelector]);

  const fetchTags = async () => {
    try {
      const response = await fetch(`/api/tags?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleOptimize = async () => {
    if (!description.trim() || optimizing) return;

    setError(null);
    setOptimizing(true);

    try {
      const response = await fetch('/api/ai/optimize-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          tagIds: selectedTagIds,
          workspaceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onOptimized(data.optimized);
        if (data.degraded) {
          setError('AI 服务不可用，返回原始描述');
        }
        return;
      }

      const data = await response.json().catch(() => null);
      setError(data?.error || 'AI 优化失败');
    } catch (error) {
      console.error('Error optimizing description:', error);
      setError('AI 优化失败');
    } finally {
      setOptimizing(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleSelector = () => {
    setShowSelector((prev) => !prev);
  };

  return (
    <div className="space-y-2">
      {/* 标签选择区域 */}
      {showTagSelector && (
        <div className="space-y-2">
          {/* 展开/收起按钮 */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-muted-foreground"
              onClick={toggleSelector}
            >
              {showSelector ? (
                <>
                  <span>收起标签选择</span>
                  <X className="h-3 w-3 ml-1" />
                </>
              ) : (
                <>
                  <span>选择标签 ({selectedTagIds.length})</span>
                </>
              )}
            </Button>
            {selectedTagIds.length > 0 && !showSelector && (
              <div className="flex gap-1 flex-wrap">
                {selectedTagIds.map((id) => {
                  const tag = tags.find((t) => t.id === id);
                  return tag ? (
                    <Badge
                      key={id}
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: tag.color }}
                    >
                      {tag.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* 标签列表 */}
          {showSelector && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-muted/30">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <Badge
                    key={tag.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer hover:opacity-80 transition-colors"
                    style={
                      isSelected
                        ? { backgroundColor: tag.color, color: 'white' }
                        : { borderColor: tag.color }
                    }
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                );
              })}
              {tags.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  暂无标签，请先在工作空间设置中创建标签
                </p>
              )}
            </div>
          )}

          {/* 选中标签的提示 */}
          {showSelector && selectedTagIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              已选择 {selectedTagIds.length} 个标签，AI 将根据对应的标签模板优化描述
            </p>
          )}
        </div>
      )}

      {/* 优化按钮 */}
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleOptimize}
        disabled={!description.trim() || optimizing || disabled}
      >
        {optimizing ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            优化中...
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3 mr-1" />
            {buttonText}
          </>
        )}
      </Button>

      {/* 错误提示 */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
