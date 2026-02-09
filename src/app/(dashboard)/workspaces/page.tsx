'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus, ArrowRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorkspaceEditDialog } from '@/components/workspaces/WorkspaceEditDialog';
import { WorkspaceDeleteDialog } from '@/components/workspaces/WorkspaceDeleteDialog';

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWorkspace, setEditingWorkspace] = useState<{ id: string; name: string } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState<{ id: string; name: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const handleEditWorkspace = (workspace: { id: string; name: string }) => {
    setEditingWorkspace(workspace);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    fetchWorkspaces();
    router.refresh();
  };

  const handleDeleteWorkspace = (workspace: { id: string; name: string }) => {
    setDeletingWorkspace(workspace);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchWorkspaces();
    router.refresh();
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
              className="hover:shadow-md transition-shadow group"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="min-w-0 flex-1"
                    onClick={() => router.push(`/workspaces/${workspace.id}/requirements`)}
                  >
                    <CardTitle className="truncate">{workspace.name}</CardTitle>
                    <CardDescription>
                      {workspace._count?.requirements ?? 0} 个需求 · {workspace._count?.members ?? 0} 位成员
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => router.push(`/workspaces/${workspace.id}/requirements`)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditWorkspace({ id: workspace.id, name: workspace.name });
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorkspace({ id: workspace.id, name: workspace.name });
                          }}
                          className="text-red-600 focus:text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <WorkspaceEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        workspace={editingWorkspace}
        onSuccess={handleEditSuccess}
      />

      <WorkspaceDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        workspace={deletingWorkspace}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
