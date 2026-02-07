'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GlobalHotkeys } from '@/components/GlobalHotkeys';
import { WorkspaceSwitcher } from '@/components/workspaces/WorkspaceSwitcher';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  LayoutDashboard,
  FolderOpen,
  LogOut,
  Plus,
  List,
  Kanban,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const { currentWorkspace, workspaces } = useWorkspaceStore();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navigation = [
    { name: '仪表板', href: '/dashboard', icon: LayoutDashboard },
    { name: '工作空间', href: '/workspaces', icon: FolderOpen },
  ];

  if (currentWorkspace) {
    navigation.push(
      { name: '需求列表', href: `/workspaces/${currentWorkspace.id}/requirements`, icon: List },
      { name: '需求看板', href: `/workspaces/${currentWorkspace.id}/board`, icon: Kanban }
    );
  }

  return (
    <div className="min-h-screen flex bg-ui-surface overflow-x-hidden">
      <GlobalHotkeys />
      <aside className="w-[250px] bg-ui-charcoal text-ui-on-dark flex flex-col shrink-0">
        <div className="p-4 border-b border-ui-on-dark/10">
          <Link href="/dashboard" className="block text-[15px] font-semibold tracking-tight">
            需求管理
          </Link>
          <div className="mt-4">
            <WorkspaceSwitcher />
          </div>
          <div className="mt-4">
            <Link
              href="/workspaces/new"
              className="inline-flex items-center gap-2 rounded-2xl border border-ui-on-dark/15 bg-transparent px-4 py-3 text-sm text-ui-on-dark hover:border-ui-on-dark/25 hover:bg-ui-hover transition-colors duration-200 ease-out"
            >
              <Plus className="h-4 w-4" />
              新建工作空间
            </Link>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={[
                  'relative overflow-hidden rounded-2xl flex items-center gap-2 px-4 py-3 text-sm transition-colors duration-200 ease-out select-none',
                  isActive
                    ? 'bg-ui-lime text-ui-on-light font-medium'
                    : 'text-ui-on-dark font-normal hover:bg-ui-hover',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute left-0 top-0 h-full w-1 bg-ui-lime rounded-r-[2px] transition-all duration-150 ease-out',
                    isActive ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0',
                  ].join(' ')}
                />
                <item.icon className="h-5 w-5" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-ui-on-dark/10 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user?.username || ''}</div>
            <div className="text-xs text-ui-on-dark/65 truncate">
              {workspaces.length > 0 ? `${workspaces.length} 个工作空间` : ''}
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={handleLogout} className="text-ui-on-dark hover:bg-ui-hover">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-ui-surface text-ui-on-light overflow-y-auto overflow-x-hidden">
        <div className="px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
