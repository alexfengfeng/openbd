'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RequirementCard } from './RequirementCard';
import { Badge } from '@/components/ui/badge';
import { getStatusLabel } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface RequirementBoardProps {
  workspaceId: string;
}

const STATUS_COLUMNS = [
  { key: 'BACKLOG', label: '待办', color: 'bg-gray-100 dark:bg-gray-800' },
  { key: 'TODO', label: '待处理', color: 'bg-purple-50 dark:bg-purple-950' },
  { key: 'IN_PROGRESS', label: '进行中', color: 'bg-blue-50 dark:bg-blue-950' },
  { key: 'DONE', label: '已完成', color: 'bg-green-50 dark:bg-green-950' },
];

export function RequirementBoard({ workspaceId }: RequirementBoardProps) {
  const router = useRouter();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequirements();
  }, [workspaceId]);

  const fetchRequirements = async () => {
    try {
      const response = await fetch(`/api/requirements?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setRequirements(data.requirements);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requirementId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/requirements/${requirementId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setRequirements((prev) =>
          prev.map((req) => (req.id === requirementId ? data.requirement : req))
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getRequirementsByStatus = (status: string) => {
    return requirements.filter((req) => req.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((column) => {
          const columnRequirements = getRequirementsByStatus(column.key);

          return (
            <div
              key={column.key}
              className={`flex-shrink-0 w-80 ${column.color} rounded-lg p-4 flex flex-col`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{column.label}</h3>
                <Badge variant="secondary">{columnRequirements.length}</Badge>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {columnRequirements.map((requirement) => (
                  <div
                    key={requirement.id}
                    onClick={() => router.push(`/workspaces/${workspaceId}/requirements/${requirement.id}`)}
                  >
                    <RequirementCard requirement={requirement} />
                  </div>
                ))}

                {columnRequirements.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                    拖拽需求到这里
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
