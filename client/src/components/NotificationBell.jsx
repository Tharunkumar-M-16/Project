import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios.js';
import useEventSource from '../hooks/useEventSource.js';
import { useToast } from '../context/ToastContext.jsx';

const icon = { document: '📄', test: '📝', class: '🎥', account: '🔐', achievement: '🏆', info: '📢' };

// Navbar notification bell — the single, real-time notifications surface for
// every role (SSE, with a slow poll as a safety net).
export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const load = useCallback(
    () =>
      api
        .get('/notifications')
        .then((r) => { setItems(r.data.notifications); setUnread(r.data.unread); })
        .catch(() => {}),
    []
  );

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  useEventSource((_name, data) => {
    if (data?.message) toast.info(data.message);
    load();
  });

  const markAll = async () => { try { await api.put('/notifications/read-all'); load(); } catch { /* non-fatal */ } };
  const markOne = async (id) => { try { await api.put(`/notifications/${id}/read`); load(); } catch { /* non-fatal */ } };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-xl text-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        🔔
        {unread > 0 && (
          <span className="absolute right-0 top-0 grid h-4 min-w-[1rem] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Mark all read</button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No notifications yet.</p>}
              {items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => !n.read && markOne(n._id)}
                  className={`flex w-full items-start gap-2.5 border-b border-slate-50 px-4 py-2.5 text-left text-sm transition last:border-0 dark:border-slate-800/60 ${
                    n.read ? '' : 'bg-brand-50/60 dark:bg-brand-500/10'
                  }`}
                >
                  <span>{icon[n.type] || 'ℹ️'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-slate-800 dark:text-slate-100">{n.message}</span>
                    <span className="block text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                  </span>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
