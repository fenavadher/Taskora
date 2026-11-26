import { AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { systemApi } from '../services/api';

export function DatabaseStatusBanner() {
  const { dbStatus, healthLoading, refreshHealth } = useAuth();

  if (healthLoading || !dbStatus || dbStatus.connected) {
    return null;
  }

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-slate-800"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-slate-900">
              MongoDB Atlas connection required
            </p>
            <p className="text-slate-600 leading-relaxed">
              {dbStatus.configured
                ? `Database connection error: ${dbStatus.error || 'Unable to connect to MongoDB Atlas.'}`
                : 'MONGO_URI is not configured in this environment yet. Set MONGO_URI in your .env file (or AI Studio Secrets) to enable user registration, login, and MongoDB task persistence.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void refreshHealth()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-amber-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Check
          </button>
          <a
            href={systemApi.getExportZipUrl()}
            download="taskora-mern-project.zip"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Download Source ZIP
          </a>
        </div>
      </div>
    </div>
  );
}
