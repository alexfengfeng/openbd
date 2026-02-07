'use client';

import { use } from 'react';
import { RequirementBoard } from '@/components/requirements/RequirementBoard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BoardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/workspaces/${workspaceId}/requirements`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">需求看板</h1>
            <p className="text-muted-foreground mt-1">拖拽管理需求状态</p>
          </div>
        </div>
      </div>

      <div className="h-[calc(100%-5rem)]">
        <RequirementBoard workspaceId={workspaceId} />
      </div>
    </div>
  );
}
