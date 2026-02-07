'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    done: 0,
    inProgress: 0,
    backlog: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces');
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces);

        // 计算统计数据
        let total = 0;
        let done = 0;
        let inProgress = 0;
        let backlog = 0;

        for (const ws of data.workspaces) {
          total += ws._count.requirements || 0;
          // 这里可以扩展获取更详细的统计数据
        }

        setStats({ total, done, inProgress, backlog });
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 欢迎头部 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">仪表板</h1>
        <p className="text-muted-foreground mt-1">
          欢迎使用用户需求管理系统
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总需求数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              所有工作空间
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.done}</div>
            <p className="text-xs text-muted-foreground mt-1">
              完成的需求
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">
              正在处理
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.backlog}</div>
            <p className="text-xs text-muted-foreground mt-1">
              等待处理
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 工作空间列表 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">我的工作空间</h2>
        <Link href="/workspaces/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建工作空间
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          加载中...
        </div>
      ) : workspaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">还没有工作空间</h3>
            <p className="text-sm text-muted-foreground mb-4">
              创建一个工作空间开始管理需求
            </p>
            <Link href="/workspaces/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建工作空间
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}/requirements`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{workspace.name}</CardTitle>
                  <CardDescription>
                    {workspace._count.requirements} 个需求 · {workspace._count.members} 位成员
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
