'use client';

import { use } from 'react';
import { RequirementBoard } from '@/components/requirements/RequirementBoard';

export default function BoardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);

  return (
    <div className="h-[calc(100vh-6rem)]">
      <RequirementBoard workspaceId={workspaceId} />
    </div>
  );
}
