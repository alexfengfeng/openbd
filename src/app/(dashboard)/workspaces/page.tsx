'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus, ArrowRight } from 'lucide-react';

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
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
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">工作空间</h1>
          <p className="text-muted-foreground mt-1">选择一个工作空间开始管理需求</p>
        </div>
        <Link href="/workspaces/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建工作空间
          </Button>
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardHeader className="items-center text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
            <CardTitle className="mt-2">还没有工作空间</CardTitle>
            <CardDescription>创建一个工作空间开始管理需求</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card
              key={workspace.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/workspaces/${workspace.id}/requirements`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{workspace.name}</CardTitle>
                    <CardDescription>
                      {workspace._count?.requirements ?? 0} 个需求 · {workspace._count?.members ?? 0} 位成员
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
