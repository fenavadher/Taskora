import { useState, type FormEvent } from 'react';
import { Loader2, Plus } from 'lucide-react';
import type { TaskPayload, TaskPriority, TaskStatus } from '../types';
import { fromDateInputValue } from '../utils/dateUtils';

interface QuickAddBarProps {
  defaultStatus?: TaskStatus;
  onQuickAdd: (payload: TaskPayload) => Promise<void>;
}

export function QuickAddBar({
  defaultStatus = 'Pending',
  onQuickAdd,
}: QuickAddBarProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [category, setCategory] = useState('Work');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Enter a task title to quick-add.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onQuickAdd({
        title: trimmed,
        description: '',
        priority,
        status: defaultStatus,
        category: category.trim() || 'General',
        dueDate: fromDateInputValue(dueDate),
      });
      setTitle('');
      setDueDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 lg:flex-row lg:items-center"
      >
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Quick add a task (e.g., Write unit tests for auth routes)..."
            aria-label="Quick add task title"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            aria-label="Quick add priority"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Quick add category"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="Work">Work</option>
            <option value="Study">Study</option>
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Personal">Personal</option>
            <option value="General">General</option>
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Quick add due date"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Quick Add
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
