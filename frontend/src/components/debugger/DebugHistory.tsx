import { useState } from 'react';
import {
  History,
  Trash2,
  Edit2,
  Check,
  X,
  Code2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { StoredDebugSessionSummary } from '@/types/debugger';

interface DebugHistoryProps {
  sessions: StoredDebugSessionSummary[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  isLoading?: boolean;
}

export function DebugHistory({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  isLoading,
}: DebugHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startRename = (session: StoredDebugSessionSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session._id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved debug session?')) {
      onDeleteSession(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-xs text-gray-500 dark:text-slate-400">
        <Sparkles className="w-5 h-5 text-blue-500 animate-spin mx-auto mb-2" />
        Loading previous sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-6 text-center rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
        <History className="w-8 h-8 text-gray-400 dark:text-slate-600 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
          No Sessions Yet
        </h4>
        <p className="text-[11px] text-gray-500 dark:text-slate-400">
          Run your first code analysis above to save and revisit debug traces anytime.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Saved Debugging History ({sessions.length})
          </h3>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[360px] overflow-auto">
        {sessions.map((sess) => {
          const isActive = activeSessionId === sess._id;
          const isRenaming = editingId === sess._id;
          const dateStr = new Date(sess.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={sess._id}
              onClick={() => onSelectSession(sess._id)}
              className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors group ${
                isActive
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600'
                  : 'hover:bg-gray-50/70 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="px-2 py-1 text-xs rounded border border-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={(e) => handleSaveRename(sess._id, e)}
                      className="p-1 text-emerald-600 hover:text-emerald-700"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRename}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate">
                      {sess.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => startRename(sess, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-opacity"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2.5 mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 uppercase font-mono font-medium text-blue-600 dark:text-blue-400">
                    <Code2 className="w-3 h-3" />
                    {sess.language}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    {dateStr}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-rose-500 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    {sess.issues?.length || 0} issues
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDelete(sess._id, e)}
                  title="Delete session"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

