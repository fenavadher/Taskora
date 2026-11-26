import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import type { Task, TaskPayload, TaskPriority, TaskStatus } from '../types';
import { fromDateInputValue, toDateInputValue } from '../utils/dateUtils';

interface TaskModalProps {
  open: boolean;
  editingTask: Task | null;
  defaultStatus?: TaskStatus;
  onClose: () => void;
  onSubmit: (payload: TaskPayload, taskId?: string) => Promise<void>;
}

const PRESET_CATEGORIES = [
  'General',
  'Work',
  'Study',
  'Engineering',
  'Design',
  'Personal',
];

export function TaskModal({
  open,
  editingTask,
  defaultStatus = 'Pending',
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [category, setCategory] = useState('General');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
      setCategory(editingTask.category || 'General');
      setDueDate(toDateInputValue(editingTask.dueDate));
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus(defaultStatus);
      setCategory('General');
      setDueDate('');
    }
    setError(null);
  }, [open, editingTask, defaultStatus]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a task title.');
      return;
    }
    if (trimmedTitle.length > 160) {
      setError('Task title cannot exceed 160 characters.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(
        {
          title: trimmedTitle,
          description: description.trim(),
          priority,
          status,
          category: category.trim() || 'General',
          dueDate: fromDateInputValue(dueDate),
        },
        editingTask?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="task-modal-title" className="font-display text-lg font-semibold text-slate-900">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Task Title <span className="text-rose-600">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Implement REST API validation"
              maxLength={160}
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes, acceptance criteria, or links..."
              rows={3}
              maxLength={2000}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-priority"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-status"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-category"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Category
              </label>
              <input
                id="task-category"
                type="text"
                list="taskora-category-options"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Engineering"
                maxLength={40}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <datalist id="taskora-category-options">
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label
                htmlFor="task-due-date"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
