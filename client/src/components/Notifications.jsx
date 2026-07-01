import { useEffect, useState } from 'react';
import api from '../api/axios.js';

// Student notifications feed — updates when tutors add/edit documents or tests.
export default function Notifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(true);

  const load = () =>
    api.get('/notifications').then((r) => {
      setItems(r.data.notifications);
      setUnread(r.data.unread);
    }).catch(() => {});

  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // light polling
    return () => clearInterval(id);
  }, []);

  const markAll = async () => {
    await api.put('/notifications/read-all');
    load();
  };

  const icon = { document: '📄', test: '📝' };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          🔔 Notifications
          {unread > 0 && (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">{unread}</span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAll} className="text-sm font-medium text-brand-600">Mark all read</button>
          )}
          <button onClick={() => setOpen((v) => !v)} className="text-sm text-slate-400">{open ? 'Hide' : 'Show'}</button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          {items.length === 0 && <p className="text-sm text-slate-400">No notifications yet.</p>}
          {items.map((n) => (
            <div key={n._id}
              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${n.read ? 'bg-slate-50 text-slate-500' : 'bg-brand-50 text-slate-800'}`}>
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
