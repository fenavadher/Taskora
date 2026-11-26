import { useCallback, useEffect, useMemo, useState } from 'react';
import { ListTodo, Plus, Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { WorkspaceOutletContext } from '../components/AppShell';
import { QuickAddBar } from '../components/QuickAddBar';
import { TaskRow } from '../components/TaskRow';
import { getApiErrorMessage, tasksApi } from '../services/api';
import type { Task, TaskFilters, TaskPayload, TaskStatus } from '../types';

interface TasksPageProps {
  view: 'all' | 'today' | 'completed';
}

const STATUS_TABS = ['All', 'Pending', 'In Progress', 'Completed'] as const;

export function TasksPage({ view }: TasksPageProps) {
  const {
    searchQuery,
    setSearchQuery,
    refreshKey,
    triggerRefresh,
    openCreateModal,
    openEditModal,
  } = useOutletContext<WorkspaceOutletContext>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<TaskFilters['sort']>('dueDate_asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
  }, [view]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: TaskFilters = {
        view,
        sort: sortBy,
        search: searchQuery.trim() || undefined,
        status: view === 'completed' ? 'Completed' : statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
      };
      const data = await tasksApi.getTasks(filters);
      setTasks(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load tasks.'));
    } finally {
      setLoading(false);
    }
  }, [view, sortBy, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTasks();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [loadTasks, refreshKey]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>(['General', 'Work', 'Study', 'Engineering', 'Design', 'Personal']);
    for (const t of tasks) {
      if (t.category) set.add(t.category);
    }
    return Array.from(set).sort();
  }, [tasks]);

  const handleQuickAdd = async (payload: TaskPayload) => {
    const finalPayload: TaskPayload = { ...payload };
    if (view === 'completed') {
      finalPayload.status = 'Completed';
    } else if (view === 'today' && !finalPayload.dueDate) {
      const now = new Date();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0, 0);
      finalPayload.dueDate = todayEnd.toISOString();
    }
    await tasksApi.createTask(finalPayload);
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

  const emptyMessage =
    view === 'today'
      ? 'No tasks are due today. Add a task below or adjust your filters.'
      : view === 'completed'
        ? 'No completed tasks match your filters yet.'
        : 'No tasks match your current filters.';

  return (
    <div className="space-y-5">
      <QuickAddBar
        defaultStatus={view === 'completed' ? 'Completed' : 'Pending'}
        onQuickAdd={handleQuickAdd}
      />

      {/* Filter & Sort Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Mobile search */}
        <div className="relative md:hidden">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Status segmented tabs */}
        {view !== 'completed' ? (
          <div
            role="tablist"
            aria-label="Filter tasks by status"
            className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit"
          >
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab}
                onClick={() => setStatusFilter(tab)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs font-medium text-slate-500">
            Showing completed tasks ({tasks.length})
          </div>
        )}

        {/* Dropdown filters & sort */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as TaskFilters['sort'])}
            aria-label="Sort tasks"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="dueDate_asc">Due Date (Earliest)</option>
            <option value="dueDate_desc">Due Date (Latest)</option>
            <option value="priority">Priority (High to Low)</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadTasks()}
            className="rounded-lg border border-rose-300 bg-white px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Task List Container */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span className="font-medium text-slate-700 tabular-nums">
            {loading ? 'Loading tasks...' : `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}
          </span>
          {(statusFilter !== 'All' ||
            priorityFilter !== 'All' ||
            categoryFilter !== 'All' ||
            searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('All');
                setPriorityFilter('All');
                setCategoryFilter('All');
                setSearchQuery('');
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center justify-between px-4 py-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-2/5 rounded bg-slate-100 animate-pulse" />
                  <div className="h-3 w-1/4 rounded bg-slate-100 animate-pulse" />
                </div>
                <div className="h-7 w-28 rounded bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <ListTodo className="h-9 w-9 text-slate-300 mb-3" />
            <h2 className="text-sm font-semibold text-slate-900">
              No tasks found
            </h2>
            <p className="mt-1 max-w-sm text-xs text-slate-500">{emptyMessage}</p>
            <button
              type="button"
              onClick={() =>
                openCreateModal(view === 'completed' ? 'Completed' : 'Pending')
              }
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </button>
          </div>
        ) : (
          <div>
            {tasks.map((task) => (
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
      </div>
    </div>
  );
}
