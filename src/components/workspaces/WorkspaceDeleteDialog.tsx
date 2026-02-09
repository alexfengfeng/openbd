'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle } from 'lucide-react';

interface WorkspaceDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: { id: string; name: string } | null;
  onSuccess?: () => void;
}

export function WorkspaceDeleteDialog({
  open,
  onOpenChange,
  workspace,
  onSuccess,
}: WorkspaceDeleteDialogProps) {
  const [confirmName, setConfirmName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workspace) {
      setConfirmName('');
      setError(null);
    }
  }, [workspace]);

  const handleDelete = async () => {
    if (!workspace || !confirmName.trim()) {
      setError('请输入工作空间名称');
      return;
    }

    if (confirmName !== workspace.name) {
      setError('输入的名称与工作空间名称不匹配');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmName: confirmName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || '删除失败，请稍后重试');
        return;
      }

      // 显示成功通知，带撤销按钮
      toast.success('工作空间已删除', {
        description: '您可以在 8 秒内撤销此操作',
        action: {
          label: '撤销',
          onClick: async () => {
            try {
              const restoreResponse = await fetch(`/api/workspaces/${workspace.id}/restore`, {
                method: 'POST',
              });

              if (!restoreResponse.ok) {
                toast.error('恢复失败，请稍后重试');
                return;
              }

              toast.success('工作空间已恢复');
              onSuccess?.();
            } catch (e) {
              toast.error('恢复失败，请稍后重试');
            }
          },
        },
        duration: 8000, // 8 秒后撤销按钮消失
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      setError('删除失败，请稍后重试');
      toast.error('删除失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            删除工作空间
          </DialogTitle>
          <DialogDescription>
            此操作将软删除工作空间，数据将被保留但不再显示
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 dark:bg-red-950 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              您即将删除工作空间 <strong>"{workspace?.name}"</strong>
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2">
              请输入工作空间名称以确认删除
            </p>
          </div>
          <div className="space-y-2">
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={`输入 "${workspace?.name}" 确认删除`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDelete();
              }}
              disabled={submitting}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={submitting || confirmName !== workspace?.name}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                删除中...
              </>
            ) : (
              '确认删除'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
