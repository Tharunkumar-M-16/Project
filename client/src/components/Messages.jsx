import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import useEventSource from '../hooks/useEventSource.js';
import ChatBox from './ChatBox.jsx';

// Role-aware messaging: student chats with their tutor; tutor picks a student.
export default function Messages() {
  const { user } = useAuth();
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null); // {_id, name}
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    () =>
      api
        .get('/messages')
        .then((r) => {
          setConvos(r.data);
          // Auto-open the only conversation (student's tutor).
          if (user.role === 'student' && r.data[0]?.user) setActive((a) => a || r.data[0].user);
        })
        .catch(() => {})
        .finally(() => setLoading(false)),
    [user.role]
  );
  useEffect(() => { load(); }, [load]);
  useEventSource(() => load(), ['message']); // refresh list ordering / unread on new message

  if (loading) return <div className="card text-sm text-slate-400">Loading messages…</div>;

  if (user.role === 'student') {
    if (!active) {
      return <div className="card py-10 text-center text-sm text-slate-400">No tutor assigned yet. Ask your mentor to assign you a tutor to start chatting.</div>;
    }
    return (
      <div className="card">
        <ChatBox otherId={active._id} otherName={active.name} />
      </div>
    );
  }

  // Tutor: master-detail (student list + chat)
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="card md:col-span-1">
        <h3 className="section-title mb-3">Your students</h3>
        {convos.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No students assigned yet.</p>}
        <div className="space-y-1">
          {convos.map((c) => (
            <button
              key={c.user._id}
              onClick={() => setActive(c.user)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                active?._id === c.user._id ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                  {c.user.name?.[0]?.toUpperCase()}
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{c.user.name}</span>
              </span>
              {c.unread > 0 && <span className="chip bg-rose-500 text-xs font-semibold text-white">{c.unread}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="card md:col-span-2">
        {active ? <ChatBox otherId={active._id} otherName={active.name} /> : <p className="py-10 text-center text-sm text-slate-400">Select a student to chat.</p>}
      </div>
    </div>
  );
}
