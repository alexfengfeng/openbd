import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  _count?: {
    requirements: number;
    members: number;
  };
};

type WorkspaceState = {
  workspaces: WorkspaceSummary[];
  currentWorkspace: WorkspaceSummary | null;
  recentWorkspaces: string[];
  isLoading: boolean;

  setWorkspaces: (workspaces: WorkspaceSummary[]) => void;
  setCurrentWorkspace: (workspace: WorkspaceSummary) => void;
  addToRecent: (workspaceId: string) => void;
  getRecentWorkspaces: () => WorkspaceSummary[];
  switchWorkspace: (workspaceId: string) => Promise<void>;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      recentWorkspaces: [],
      isLoading: false,

      setWorkspaces: (workspaces) => set({ workspaces }),

      setCurrentWorkspace: (workspace) => {
        set({ currentWorkspace: workspace });
        get().addToRecent(workspace.id);
        fetch(`/api/workspaces/${workspace.id}/visit`, { method: 'POST' }).catch(() => undefined);
      },

      addToRecent: (workspaceId) => {
        const recent = get().recentWorkspaces.filter((id) => id !== workspaceId);
        set({ recentWorkspaces: [workspaceId, ...recent].slice(0, 5) });
      },

      getRecentWorkspaces: () => {
        const { workspaces, recentWorkspaces } = get();
        return recentWorkspaces
          .map((id) => workspaces.find((w) => w.id === id))
          .filter(Boolean) as WorkspaceSummary[];
      },

      switchWorkspace: async (workspaceId) => {
        const workspace = get().workspaces.find((w) => w.id === workspaceId);
        if (workspace) {
          get().setCurrentWorkspace(workspace);
        }
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        recentWorkspaces: state.recentWorkspaces,
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
);

