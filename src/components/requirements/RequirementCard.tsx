'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';
import { Clock, Pencil, User, MoreHorizontal, Trash2 } from 'lucide-react';
import { QuickEditDialog } from './QuickEditDialog';
import { RequirementDeleteDialog } from './RequirementDeleteDialog';

interface RequirementCardProps {
  requirement: any;
  onClick?: () => void;
  showActions?: boolean;
  onUpdated?: (requirement: any) => void;
  onDeleted?: () => void;
}

export function RequirementCard({ requirement, onClick, showActions = true, onUpdated, onDeleted }: RequirementCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSave = async (data: { title: string; description: string; status: string; priority: string }) => {
    const response = await fetch(`/api/requirements/${requirement.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update requirement');
    }

    const json = await response.json();
    if (json?.requirement) onUpdated?.(json.requirement);
  };

  const handleAiTitle = async (description: string) => {
    const response = await fetch('/api/ai/suggest-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    if (!response.ok) return '';
    const json = await response.json();
    return typeof json?.title === 'string' ? json.title : '';
  };

  const handleDeleted = () => {
    setDeleteOpen(false);
    onDeleted?.();
  };

  return (
    <>
      <Card className={`cursor-pointer ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold line-clamp-2">{requirement.title}</h3>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteOpen(true);
                  }}
                  className="text-red-600 focus:text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {requirement.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {requirement.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 标签 */}
        {requirement.tags && requirement.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {requirement.tags.map((tag: any) => (
              <Badge
                key={tag.id}
                variant="outline"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          {/* 状态和优先级 */}
          <div className="flex gap-2">
            <Badge className={getStatusColor(requirement.status)}>
              {getStatusLabel(requirement.status)}
            </Badge>
            <Badge className={getPriorityColor(requirement.priority)}>
              {getPriorityLabel(requirement.priority)}
            </Badge>
          </div>

          {/* 负责人和截止日期 */}
          <div className="flex items-center gap-3 text-muted-foreground">
            {requirement.assignee && (
              <div className="flex items-center gap-2" title={`负责人: ${requirement.assignee.username}`}>
                <User className="h-3 w-3" />
                <span className="text-xs">{requirement.assignee.username}</span>
              </div>
            )}
            {requirement.dueDate && (
              <div className="flex items-center gap-2" title={`截止日期: ${formatDate(requirement.dueDate)}`}>
                <Clock className="h-3 w-3" />
                <span className="text-xs">{formatDate(requirement.dueDate)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
      <QuickEditDialog
        requirement={requirement}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSave}
        onAiTitle={handleAiTitle}
      />
      <RequirementDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        requirement={requirement}
        onSuccess={handleDeleted}
      />
    </>
  );
}
