'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';
import { Clock, User } from 'lucide-react';

interface RequirementCardProps {
  requirement: any;
  onClick?: () => void;
  showActions?: boolean;
}

export function RequirementCard({ requirement, onClick, showActions = true }: RequirementCardProps) {
  return (
    <Card
      className={`cursor-pointer ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold line-clamp-2">{requirement.title}</h3>
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
  );
}
