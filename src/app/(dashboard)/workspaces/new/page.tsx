'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('工作空间名称不能为空');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || '创建失败，请稍后重试');
        return;
      }

      const data = await response.json();
      router.push(`/workspaces/${data.workspace.id}/requirements`);
      router.refresh();
    } catch (e) {
      setError('创建失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/workspaces">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">新建工作空间</h1>
          <p className="text-muted-foreground mt-1">创建一个新的工作空间，用于组织需求</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>请输入工作空间名称</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：产品需求管理"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建'
              )}
            </Button>
            <Link href="/workspaces">
              <Button variant="outline" disabled={submitting}>
                取消
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
