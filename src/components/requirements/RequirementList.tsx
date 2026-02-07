'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RequirementCard } from './RequirementCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';

interface RequirementListProps {
  workspaceId: string;
}

export function RequirementList({ workspaceId }: RequirementListProps) {
  const router = useRouter();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  useEffect(() => {
    fetchRequirements();
  }, [workspaceId, statusFilter, priorityFilter]);

  const fetchRequirements = async () => {
    try {
      const params = new URLSearchParams({ workspaceId });
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const response = await fetch(`/api/requirements?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRequirements(data.requirements);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequirements = requirements.filter((req) =>
    req.title.toLowerCase().includes(search.toLowerCase()) ||
    (req.description && req.description.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: requirements.length,
    backlog: requirements.filter((r) => r.status === 'BACKLOG').length,
    todo: requirements.filter((r) => r.status === 'TODO').length,
    inProgress: requirements.filter((r) => r.status === 'IN_PROGRESS').length,
    done: requirements.filter((r) => r.status === 'DONE').length,
  };

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索需求..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select
            value={statusFilter || 'ALL'}
            onValueChange={(value) => setStatusFilter(value === 'ALL' ? '' : value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部</SelectItem>
              <SelectItem value="BACKLOG">待办</SelectItem>
              <SelectItem value="TODO">待处理</SelectItem>
              <SelectItem value="IN_PROGRESS">进行中</SelectItem>
              <SelectItem value="DONE">已完成</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter || 'ALL'}
            onValueChange={(value) => setPriorityFilter(value === 'ALL' ? '' : value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部</SelectItem>
              <SelectItem value="URGENT">紧急</SelectItem>
              <SelectItem value="HIGH">高</SelectItem>
              <SelectItem value="MEDIUM">中</SelectItem>
              <SelectItem value="LOW">低</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => router.push(`/workspaces/${workspaceId}/requirements/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          新建需求
        </Button>
      </div>

      {/* 统计 */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setStatusFilter('')}>
          全部 ({stats.total})
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setStatusFilter('BACKLOG')}>
          待办 ({stats.backlog})
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setStatusFilter('TODO')}>
          待处理 ({stats.todo})
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setStatusFilter('IN_PROGRESS')}>
          进行中 ({stats.inProgress})
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setStatusFilter('DONE')}>
          已完成 ({stats.done})
        </Badge>
      </div>

      {/* 需求列表 */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          加载中...
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          {search || statusFilter || priorityFilter ? '没有找到匹配的需求' : '暂无需求，点击上方按钮创建'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequirements.map((requirement) => (
            <RequirementCard
              key={requirement.id}
              requirement={requirement}
              onClick={() => router.push(`/workspaces/${workspaceId}/requirements/${requirement.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
