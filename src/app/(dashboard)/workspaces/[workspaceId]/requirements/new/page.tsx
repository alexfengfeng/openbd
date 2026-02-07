'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AIRequirementCreator } from '@/components/ai/AIRequirementCreator';

export default function NewRequirementPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/workspaces/${workspaceId}/requirements`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">新建需求</h1>
          <p className="text-muted-foreground mt-1">使用 AI 或自然语言快速创建需求</p>
        </div>
      </div>

      <AIRequirementCreator workspaceId={workspaceId} />
    </div>
  );
}
