import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  ListTodo,
  Plus,
} from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import type { WorkspaceOutletContext } from '../components/AppShell';
import { DailyProgressCard } from '../components/DailyProgressCard';
import { DeadlineAlertsPanel } from '../components/DeadlineAlertsPanel';
import { QuickAddBar } from '../components/QuickAddBar';
import { TaskRow } from '../components/TaskRow';
import { getApiErrorMessage, tasksApi } from '../services/api';
import type { DashboardPayload, Task, TaskPayload, TaskStatus } from '../types';

const EMPTY_DASHBOARD: DashboardPayload = {
  stats: {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
    dueSoon: 0,
    completedToday: 0,
    completionRate: 0,
  },
  dailyProgress: [],
  alerts: [],
  categories: [],
};

export function DashboardPage() {
  const { refreshKey, triggerRefresh, openCreateModal, openEditModal } =
    useOutletContext<WorkspaceOutletContext>();

  const [dashboard, setDashboard] = useState<DashboardPayload>(EMPTY_DASHBOARD);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, tasksData] = await Promise.all([
        tasksApi.getStats(),
        tasksApi.getTasks({ sort: 'newest' }),
      ]);
      setDashboard(statsData);
      setRecentTasks(tasksData.slice(0, 6));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard, refreshKey]);

  const handleQuickAdd = async (payload: TaskPayload) => {
    await tasksApi.createTask(payload);
    triggerRefresh();
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    await tasksApi.updateTask(task.id, { status: newStatus });
    triggerRefresh();
  };

  const handleDelete = async (taskId: string) => {
    await tasksApi.deleteTask(taskId);
    triggerRefresh();
  };

  const statCards = [
    {
      label: 'Total Tasks',
      value: dashboard.stats.total,
      icon: Layers,
      iconColor: 'text-slate-600',
      valueColor: 'text-slate-900',
    },
    {
      label: 'Pending',
      value: dashboard.stats.pending,
      icon: ListTodo,
      iconColor: 'text-amber-600',
      valueColor: 'text-slate-900',
    },
    {
      label: 'In Progress',
      value: dashboard.stats.inProgress,
      icon: Clock,
      iconColor: 'text-indigo-600',
      valueColor: 'text-indigo-700',
    },
    {
      label: 'Completed',
      value: dashboard.stats.completed,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-700',
    },
    {
      label: 'Overdue',
      value: dashboard.stats.overdue,
      icon: AlertCircle,
      iconColor: 'text-rose-600',
      valueColor: dashboard.stats.overdue > 0 ? 'text-rose-600' : 'text-slate-900',
    },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="rounded-lg border border-rose-300 bg-white px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <section aria-label="Task summary metrics">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    {card.label}
                  </span>
                  <Icon className={`h-4 w-4 shrink-0 ${card.iconColor}`} />
                </div>
                <p
                  className={`mt-2 font-display text-2xl font-bold tabular-nums ${card.valueColor}`}
                >
                  {loading ? '—' : card.value}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Add */}
      <QuickAddBar onQuickAdd={handleQuickAdd} />

      {/* Daily Progress + Deadline Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DailyProgressCard
          stats={dashboard.stats}
          dailyProgress={dashboard.dailyProgress}
        />
        <DeadlineAlertsPanel
          alerts={dashboard.alerts}
          onStatusChange={handleStatusChange}
          onEdit={openEditModal}
        />
      </div>

      {/* Recent Tasks */}
      <section
        aria-labelledby="recent-tasks-heading"
        className="rounded-xl border border-slate-200 bg-white overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="recent-tasks-heading"
              className="font-display text-base font-semibold text-slate-900"
            >
              Recent Tasks
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest tasks added to your workspace
            </p>
          </div>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap shrink-0"
          >
            View all tasks
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center justify-between px-4 py-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 rounded bg-slate-100 animate-pulse" />
                  <div className="h-3 w-1/4 rounded bg-slate-100 animate-pulse" />
                </div>
                <div className="h-7 w-24 rounded bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <ListTodo className="h-8 w-8 text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">
              No tasks yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Create your first task using the Quick Add bar above or open the full task form.
            </p>
            <button
              type="button"
              onClick={() => openCreateModal('Pending')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Create First Task
            </button>
          </div>
        ) : (
          <div>
            {recentTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
