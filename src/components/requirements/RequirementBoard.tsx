'use client';

import { DraggableBoard } from './DraggableBoard';

interface RequirementBoardProps {
  workspaceId: string;
}

export function RequirementBoard({ workspaceId }: RequirementBoardProps) {
  return <DraggableBoard workspaceId={workspaceId} />;
}
