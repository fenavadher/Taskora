import { Menu, Plus, Search } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onOpenMobileNav: () => void;
  onCreateTask: () => void;
}

export function TopBar({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  onOpenMobileNav,
  onCreateTask,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden shrink-0 cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-semibold text-slate-900 sm:text-xl">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block truncate text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {onSearchChange !== undefined && (
          <div className="relative hidden md:block w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}

        <button
          type="button"
          onClick={onCreateTask}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Task</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </header>
  );
}
