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
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface RequirementListProps {
  workspaceId: string;
}

const PAGE_SIZE = 9;

export function RequirementList({ workspaceId }: RequirementListProps) {
  const router = useRouter();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page, pageSize: PAGE_SIZE });

  useEffect(() => {
    fetchRequirements();
  }, [workspaceId, statusFilter, priorityFilter, page]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        workspaceId,
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
      });
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const response = await fetch(`/api/requirements?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRequirements(data.requirements);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  // 当筛选条件改变时，重置到第一页
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'ALL' ? '' : value);
    setPage(1);
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value === 'ALL' ? '' : value);
    setPage(1);
  };

  const filteredRequirements = requirements.filter((req) =>
    req.title.toLowerCase().includes(search.toLowerCase()) ||
    (req.description && req.description.toLowerCase().includes(search.toLowerCase()))
  );

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
            onValueChange={handleStatusFilterChange}
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
            onValueChange={handlePriorityFilterChange}
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

      {/* 统计信息 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>共 {pagination.total} 个需求</span>
        <span>第 {page} / {pagination.totalPages} 页</span>
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
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRequirements.map((requirement) => (
              <RequirementCard
                key={requirement.id}
                requirement={requirement}
                onClick={() => router.push(`/workspaces/${workspaceId}/requirements/${requirement.id}`)}
                onUpdated={(updated) => {
                  setRequirements((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
                }}
              />
            ))}
          </div>

          {/* 分页控件 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                上一页
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="w-9 h-9"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                下一页
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
