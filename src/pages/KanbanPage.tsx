import { useCallback, useEffect, useState, type DragEvent } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { WorkspaceOutletContext } from '../components/AppShell';
import { getApiErrorMessage, tasksApi } from '../services/api';
import type { Task, TaskStatus } from '../types';
import { formatDueDate, getDeadlineState } from '../utils/dateUtils';

const COLUMNS: { status: TaskStatus; title: string; dotColor: string }[] = [
  { status: 'Pending', title: 'Pending', dotColor: 'text-amber-600' },
  { status: 'In Progress', title: 'In Progress', dotColor: 'text-indigo-600' },
  { status: 'Completed', title: 'Completed', dotColor: 'text-emerald-600' },
];

export function KanbanPage() {
  const {
    searchQuery,
    setSearchQuery,
    refreshKey,
    triggerRefresh,
    openCreateModal,
    openEditModal,
  } = useOutletContext<WorkspaceOutletContext>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tasksApi.getTasks({
        search: searchQuery.trim() || undefined,
        priority: priorityFilter,
        sort: 'dueDate_asc',
      });
      setTasks(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load Kanban board.'));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, priorityFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTasks();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [loadTasks, refreshKey]);

  const moveTask = async (taskId: string, nextStatus: TaskStatus) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.status === nextStatus) return;

    // Optimistic UI update with rollback on failure
    const previous = tasks;
    setTasks((curr) =>
      curr.map((item) =>
        item.id === taskId ? { ...item, status: nextStatus } : item
      )
    );
    try {
      await tasksApi.updateTask(taskId, { status: nextStatus });
      triggerRefresh();
    } catch (err) {
      setTasks(previous);
      setError(getApiErrorMessage(err, 'Could not move task.'));
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await tasksApi.deleteTask(taskId);
      setConfirmDeleteId(null);
      triggerRefresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete task.'));
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLElement>, colStatus: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverCol(null);
    setDraggedTaskId(null);
    if (id) {
      void moveTask(id, colStatus);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs md:hidden">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search board..."
            aria-label="Search Kanban board"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <p className="text-xs text-slate-500">
          Drag cards between columns or use the quick move arrows on each card.
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter board by priority"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
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

      {/* 3-Column Kanban Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-start">
        {COLUMNS.map((column, colIndex) => {
          const columnTasks = tasks.filter((t) => t.status === column.status);
          const isDropTarget = dragOverCol === column.status;

          return (
            <section
              key={column.status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(column.status);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, column.status)}
              aria-label={`${column.title} column`}
              className={`rounded-xl border p-4 transition-colors min-h-[260px] ${
                isDropTarget
                  ? 'border-indigo-400 bg-indigo-50/50'
                  : 'border-slate-200 bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <h2 className={`font-display text-sm font-semibold ${column.dotColor}`}>
                    {column.title}
                  </h2>
                  <span className="text-xs font-medium text-slate-500 tabular-nums">
                    {columnTasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openCreateModal(column.status)}
                  aria-label={`Add task to ${column.title}`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((skeleton) => (
                    <div
                      key={skeleton}
                      className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2"
                    >
                      <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : columnTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300/80 bg-white/60 py-10 px-4 text-center">
                  <p className="text-xs text-slate-500">
                    No tasks in {column.title}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {columnTasks.map((task) => {
                    const deadlineState = getDeadlineState(task.dueDate, task.status);
                    const prevCol = colIndex > 0 ? COLUMNS[colIndex - 1] : null;
                    const nextCol =
                      colIndex < COLUMNS.length - 1 ? COLUMNS[colIndex + 1] : null;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverCol(null);
                        }}
                        className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-colors cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={`text-sm font-medium leading-snug ${
                              task.status === 'Completed'
                                ? 'text-slate-400 line-through'
                                : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </h3>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              aria-label={`Edit ${task.title}`}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDeleteId(
                                  confirmDeleteId === task.id ? null : task.id
                                )
                              }
                              aria-label={`Delete ${task.title}`}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 tabular-nums">
                          <span className="text-slate-600">
                            {task.category || 'General'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              task.priority === 'High'
                                ? 'text-rose-600 font-medium'
                                : task.priority === 'Medium'
                                  ? 'text-amber-700 font-medium'
                                  : 'text-slate-500'
                            }
                          >
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span
                                className={`inline-flex items-center gap-1 ${
                                  deadlineState === 'overdue'
                                    ? 'text-rose-600 font-medium'
                                    : deadlineState === 'today' || deadlineState === 'soon'
                                      ? 'text-amber-700 font-medium'
                                      : 'text-slate-500'
                                }`}
                              >
                                {deadlineState === 'overdue' ? (
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                ) : (
                                  <Calendar className="h-3 w-3 shrink-0" />
                                )}
                                {formatDueDate(task.dueDate)}
                              </span>
                            </>
                          )}
                        </div>

                        {confirmDeleteId === task.id && (
                          <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
                            <span className="text-xs text-slate-500 mr-auto">
                              Delete task?
                            </span>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(task.id)}
                              className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                          {prevCol ? (
                            <button
                              type="button"
                              onClick={() => void moveTask(task.id, prevCol.status)}
                              className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                              <ArrowLeft className="h-3 w-3" />
                              {prevCol.title}
                            </button>
                          ) : (
                            <span />
                          )}

                          {nextCol ? (
                            <button
                              type="button"
                              onClick={() => void moveTask(task.id, nextCol.status)}
                              className="inline-flex items-center gap-1 text-slate-600 font-medium hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                              {nextCol.title}
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          ) : (
                            <span />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
