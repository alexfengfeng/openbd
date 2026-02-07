'use client';

import { use } from 'react';
import { RequirementList } from '@/components/requirements/RequirementList';
import { AIRequirementCreator } from '@/components/ai/AIRequirementCreator';

export default function RequirementsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RequirementList workspaceId={workspaceId} />
        </div>
        <div>
          <AIRequirementCreator workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  );
}
