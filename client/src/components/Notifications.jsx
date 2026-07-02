import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios.js';
import useEventSource from '../hooks/useEventSource.js';
import { useToast } from '../context/ToastContext.jsx';

// Real-time notifications feed (SSE), with a slow poll as a safety net.
export default function Notifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(true);
  const toast = useToast();

  const load = useCallback(
    () =>
      api
        .get('/notifications')
        .then((r) => {
          setItems(r.data.notifications);
          setUnread(r.data.unread);
        })
        .catch(() => {}),
    []
  );

  useEffect(() => {
    load();
    const id = setInterval(load, 60000); // fallback poll (SSE is the primary path)
    return () => clearInterval(id);
  }, [load]);

  // Live: reload + toast the moment the server pushes a notification.
  useEventSource((_name, data) => {
    if (data?.message) toast.info(data.message);
    load();
  });

  const markAll = async () => {
    await api.put('/notifications/read-all');
    load();
  };
  const markOne = async (id) => {
    await api.put(`/notifications/${id}/read`);
    load();
  };

  const icon = { document: '📄', test: '📝', class: '🎥', account: '🔐', achievement: '🏆' };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          🔔 Notifications
          {unread > 0 && (
            <span className="chip bg-rose-500 text-xs font-semibold text-white">{unread}</span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAll} className="btn-ghost btn-sm">Mark all read</button>
          )}
          <button onClick={() => setOpen((v) => !v)} className="btn-ghost btn-sm">{open ? 'Hide' : 'Show'}</button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          {items.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No notifications yet.</p>}
          {items.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.read && markOne(n._id)}
              className={`flex cursor-pointer items-start gap-2 rounded-xl px-3 py-2 text-sm transition ${
                n.read
                  ? 'surface text-slate-500'
                  : 'bg-brand-50 text-slate-800 dark:bg-brand-500/10 dark:text-slate-100'
              }`}
            >
              <span>{icon[n.type] || 'ℹ️'}</span>
              <div className="flex-1">
                <p>{n.message}</p>
                <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.read && <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
