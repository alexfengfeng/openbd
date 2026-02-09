'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatDateTime, getPriorityLabel, getStatusLabel, getPriorityColor, getStatusColor } from '@/lib/utils';

export default function RequirementDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; id: string }>;
}) {
  const { workspaceId, id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || 'list'; // 默认从列表来
  const backUrl = from === 'board' ? `/workspaces/${workspaceId}/board` : `/workspaces/${workspaceId}/requirements`;

  const [requirement, setRequirement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequirement();
  }, [id]);

  const fetchRequirement = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/requirements/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRequirement(data.requirement);
      } else {
        setRequirement(null);
      }
    } catch (e) {
      setRequirement(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="space-y-4">
        <Link href={backUrl}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回{from === 'board' ? '看板' : '列表'}
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>需求不存在或无权限访问</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={backUrl}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回{from === 'board' ? '看板' : '列表'}
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight truncate">{requirement.title}</h1>
          <p className="text-muted-foreground mt-1">查看需求详情</p>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Badge className={getPriorityColor(requirement.priority)}>
              {getPriorityLabel(requirement.priority)}
            </Badge>
            <Badge className={getStatusColor(requirement.status)}>
              {getStatusLabel(requirement.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">描述</div>
            <div className="whitespace-pre-wrap">{requirement.description || '-'}</div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">创建人</div>
              <div>{requirement.createdBy?.username || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">负责人</div>
              <div>{requirement.assignee?.username || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">创建时间</div>
              <div>{formatDateTime(requirement.createdAt)}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">更新时间</div>
              <div>{formatDateTime(requirement.updatedAt)}</div>
            </div>
          </div>

          {Array.isArray(requirement.tags) && requirement.tags.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">标签</div>
              <div className="flex gap-1 flex-wrap">
                {requirement.tags.map((tag: any) => (
                  <Badge key={tag.id} variant="outline">
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
