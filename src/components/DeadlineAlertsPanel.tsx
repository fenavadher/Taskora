import { AlertCircle, Check, CheckCircle2, Clock, Pencil } from 'lucide-react';
import type { Task, TaskStatus } from '../types';
import { formatDueDate, getDeadlineState } from '../utils/dateUtils';

interface DeadlineAlertsPanelProps {
  alerts: Task[];
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  onEdit: (task: Task) => void;
}

export function DeadlineAlertsPanel({
  alerts,
  onStatusChange,
  onEdit,
}: DeadlineAlertsPanelProps) {
  return (
    <section
      aria-labelledby="deadline-alerts-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col"
    >
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2
            id="deadline-alerts-heading"
            className="font-display text-base font-semibold text-slate-900"
          >
            Deadline Alerts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overdue tasks and deadlines within 48 hours
          </p>
        </div>
        <span className="text-xs font-medium text-slate-600 tabular-nums">
          {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
        </span>
      </div>

      <div className="mt-4 flex-1">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 px-4 text-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 mb-2" />
            <p className="text-sm font-medium text-slate-800">
              All deadlines on track
            </p>
            <p className="text-xs text-slate-500 mt-1">
              You have no overdue or urgent upcoming tasks.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {alerts.map((task) => {
              const state = getDeadlineState(task.dueDate, task.status);
              const isOverdue = state === 'overdue';
              return (
                <li
                  key={task.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {isOverdue ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    ) : (
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                        <span className={isOverdue ? 'text-rose-600 font-medium' : 'text-amber-700 font-medium'}>
                          {isOverdue ? 'Overdue' : state === 'today' ? 'Due today' : 'Due soon'}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>{formatDueDate(task.dueDate)}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{task.priority}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => void onStatusChange(task, 'Completed')}
                      title="Mark completed"
                      aria-label={`Mark ${task.title} completed`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      title="Edit task"
                      aria-label={`Edit ${task.title}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
