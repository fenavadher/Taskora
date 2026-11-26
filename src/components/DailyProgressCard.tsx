import type { DailyProgressPoint, TaskStats } from '../types';

interface DailyProgressCardProps {
  stats: TaskStats;
  dailyProgress: DailyProgressPoint[];
}

export function DailyProgressCard({
  stats,
  dailyProgress,
}: DailyProgressCardProps) {
  const maxVal = Math.max(
    1,
    ...dailyProgress.map((point) => Math.max(point.completed, point.created))
  );

  return (
    <section
      aria-labelledby="daily-progress-heading"
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2
            id="daily-progress-heading"
            className="font-display text-base font-semibold text-slate-900"
          >
            Daily Progress
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Completion rate and 7-day task activity
          </p>
        </div>
        <div className="text-right tabular-nums">
          <span className="font-display text-2xl font-bold text-indigo-600">
            {stats.completionRate}%
          </span>
          <p className="text-xs text-slate-500">
            {stats.completedToday} completed today
          </p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 tabular-nums">
          <span>
            {stats.completed} of {stats.total} tasks completed
          </span>
          <span>{stats.inProgress} in progress</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>

      {/* 7-Day Activity Bars */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span>Last 7 days</span>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600" />
              Completed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
              Created
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-32 pt-2">
          {dailyProgress.map((day) => {
            const completedHeight = Math.round((day.completed / maxVal) * 100);
            const createdHeight = Math.round((day.created / maxVal) * 100);
            return (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1.5 h-full justify-end"
                title={`${day.label}: ${day.completed} completed, ${day.created} created`}
              >
                <div className="flex items-end gap-1 h-24 w-full justify-center">
                  <div
                    className="w-2.5 rounded-t bg-indigo-600 transition-all duration-300"
                    style={{
                      height: `${day.completed > 0 ? Math.max(12, completedHeight) : 4}%`,
                      opacity: day.completed > 0 ? 1 : 0.2,
                    }}
                  />
                  <div
                    className="w-2.5 rounded-t bg-slate-300 transition-all duration-300"
                    style={{
                      height: `${day.created > 0 ? Math.max(12, createdHeight) : 4}%`,
                      opacity: day.created > 0 ? 1 : 0.25,
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
