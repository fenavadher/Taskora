import { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Task, TaskStatus } from '../types';
import { formatDueDate, getDeadlineState } from '../utils/dateUtils';

interface TaskRowProps {
  task: Task;
  onStatusChange: (task: Task, newStatus: TaskStatus) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskRow({
  task,
  onStatusChange,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const isCompleted = task.status === 'Completed';
  const deadlineState = getDeadlineState(task.dueDate, task.status);

  const handleToggleDone = async () => {
    setBusy(true);
    try {
      await onStatusChange(task, isCompleted ? 'Pending' : 'Completed');
    } finally {
      setBusy(false);
    }
  };

  const handleSelectStatus = async (nextStatus: TaskStatus) => {
    if (nextStatus === task.status) return;
    setBusy(true);
    try {
      await onStatusChange(task, nextStatus);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    setBusy(true);
    try {
      await onDelete(task.id);
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const priorityTextColor =
    task.priority === 'High'
      ? 'text-rose-600 font-medium'
      : task.priority === 'Medium'
        ? 'text-amber-700 font-medium'
        : 'text-slate-500';

  const deadlineColor =
    deadlineState === 'overdue'
      ? 'text-rose-600 font-medium'
      : deadlineState === 'today' || deadlineState === 'soon'
        ? 'text-amber-700 font-medium'
        : 'text-slate-500';

  return (
    <div className="group flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 hover:bg-slate-50/70 transition-colors sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => void handleToggleDone()}
          disabled={busy}
          aria-label={isCompleted ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as completed`}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer ${
            isCompleted
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-slate-300 bg-white text-transparent hover:border-indigo-500'
          }`}
        >
          <Check className="h-3.5 w-3.5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p
              className={`text-sm font-medium leading-snug ${
                isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
              }`}
            >
              {task.title}
            </p>
          </div>

          {task.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
              {task.description}
            </p>
          )}

          {/* Unboxed typographic metadata per zero-pill discipline */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span className="text-slate-600">{task.category || 'General'}</span>
            <span aria-hidden="true">·</span>
            <span className={priorityTextColor}>{task.priority} priority</span>
            <span aria-hidden="true">·</span>
            <span className={`inline-flex items-center gap-1 tabular-nums ${deadlineColor}`}>
              {deadlineState === 'overdue' ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              ) : deadlineState === 'today' || deadlineState === 'soon' ? (
                <Clock className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              )}
              {deadlineState === 'overdue'
                ? `Overdue (${formatDueDate(task.dueDate)})`
                : formatDueDate(task.dueDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pl-8 sm:pl-0 shrink-0">
        <select
          value={task.status}
          disabled={busy}
          onChange={(e) => void handleSelectStatus(e.target.value as TaskStatus)}
          aria-label={`Change status for ${task.title}`}
          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ${
            task.status === 'Completed'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : task.status === 'In Progress'
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <button
          type="button"
          onClick={() => onEdit(task)}
          disabled={busy}
          aria-label={`Edit ${task.title}`}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <Pencil className="h-4 w-4" />
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void handleConfirmDelete()}
              disabled={busy}
              className="rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={busy}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            aria-label={`Delete ${task.title}`}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
