import { useCallback, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DatabaseStatusBanner } from './DatabaseStatusBanner';
import { Sidebar } from './Sidebar';
import { TaskModal } from './TaskModal';
import { TopBar } from './TopBar';
import { getApiErrorMessage, tasksApi } from '../services/api';
import type { Task, TaskPayload, TaskStatus } from '../types';

export interface WorkspaceOutletContext {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  openCreateModal: (defaultStatus?: TaskStatus) => void;
  openEditModal: (task: Task) => void;
}

const ROUTE_META: Record<string, { title: string; subtitle: string; showSearch: boolean }> = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Overview of your tasks, daily progress, and upcoming deadlines',
    showSearch: false,
  },
  '/tasks': {
    title: 'All Tasks',
    subtitle: 'Search, filter, sort, and manage every task in your workspace',
    showSearch: true,
  },
  '/today': {
    title: "Today's Tasks",
    subtitle: 'Tasks scheduled for completion today',
    showSearch: true,
  },
  '/completed': {
    title: 'Completed Tasks',
    subtitle: 'Archive of finished work and milestones',
    showSearch: true,
  },
  '/kanban': {
    title: 'Kanban Board',
    subtitle: 'Track work across Pending, In Progress, and Completed stages',
    showSearch: true,
  },
};

export function AppShell() {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultModalStatus, setDefaultModalStatus] = useState<TaskStatus>('Pending');

  const meta = ROUTE_META[location.pathname] ?? {
    title: 'Taskora',
    subtitle: 'Task Management System',
    showSearch: true,
  };

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const openCreateModal = useCallback((defaultStatus: TaskStatus = 'Pending') => {
    setEditingTask(null);
    setDefaultModalStatus(defaultStatus);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    setDefaultModalStatus(task.status);
    setModalOpen(true);
  }, []);

  const handleModalSubmit = async (payload: TaskPayload, taskId?: string) => {
    try {
      if (taskId) {
        await tasksApi.updateTask(taskId, payload);
      } else {
        await tasksApi.createTask(payload);
      }
      triggerRefresh();
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Failed to save task.'));
    }
  };

  const outletContext: WorkspaceOutletContext = {
    searchQuery,
    setSearchQuery,
    refreshKey,
    triggerRefresh,
    openCreateModal,
    openEditModal,
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onQuickCreate={() => openCreateModal('Pending')}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          searchQuery={meta.showSearch ? searchQuery : undefined}
          onSearchChange={meta.showSearch ? setSearchQuery : undefined}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onCreateTask={() => openCreateModal('Pending')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <DatabaseStatusBanner />
          <Outlet context={outletContext} />
        </main>
      </div>

      <TaskModal
        open={modalOpen}
        editingTask={editingTask}
        defaultStatus={defaultModalStatus}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
