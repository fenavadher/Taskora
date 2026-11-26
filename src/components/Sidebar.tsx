import {
  CalendarCheck,
  CheckCircle2,
  Download,
  Kanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Plus,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { systemApi } from '../services/api';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onQuickCreate: () => void;
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: 'All Tasks', icon: ListTodo, end: false },
  { to: '/today', label: "Today's Tasks", icon: CalendarCheck, end: false },
  { to: '/completed', label: 'Completed Tasks', icon: CheckCircle2, end: false },
  { to: '/kanban', label: 'Kanban Board', icon: Kanban, end: false },
];

export function Sidebar({ mobileOpen, onCloseMobile, onQuickCreate }: SidebarProps) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200 w-64">
      <div>
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-display font-bold text-sm">
              T
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Taskora
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <button
            type="button"
            onClick={() => {
              onQuickCreate();
              onCloseMobile();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>

        <nav className="px-3 space-y-1" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-slate-200 space-y-2">
        <a
          href={systemApi.getExportZipUrl()}
          download="taskora-mern-project.zip"
          className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
          <span>Download Source ZIP</span>
        </a>

        <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {user?.name || 'User'}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.email || ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="fixed inset-y-0 left-0 z-20 w-64">{sidebarContent}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 flex h-full">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
