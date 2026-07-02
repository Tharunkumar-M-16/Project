import { useEffect, useRef, useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import useEventSource from '../hooks/useEventSource.js';

// A 1-on-1 conversation with `otherId`. Real-time via SSE 'message' events.
export default function ChatBox({ otherId, otherName }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  const load = () => api.get(`/messages/${otherId}`).then((r) => setMessages(r.data.messages)).catch(() => {});
  useEffect(() => { load(); }, [otherId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Live incoming messages from this counterpart.
  useEventSource((_n, data) => {
    if (String(data.from) === String(otherId)) {
      setMessages((m) => [...m, { _id: data._id, from: data.from, to: user._id, body: data.body, createdAt: data.createdAt }]);
    }
  }, ['message']);

  const send = async (e) => {
    e.preventDefault();
    const body = input.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post('/messages', { to: otherId, body });
      setMessages((m) => [...m, data]);
      setInput('');
    } catch {
      /* handled by interceptor / ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[26rem] flex-col">
      <div className="mb-3 flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
          {otherName?.[0]?.toUpperCase() || '?'}
        </span>
        <p className="section-title">{otherName}</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No messages yet — say hello 👋</p>}
        {messages.map((m) => {
          const mine = String(m.from) === String(user._id);
          return (
            <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-brand-600 text-white' : 'surface text-slate-800 dark:text-slate-100'}`}>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-0.5 text-[10px] ${mine ? 'text-brand-100' : 'text-slate-400'}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input className="input flex-1" placeholder="Type a message…" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-primary" disabled={busy}>Send</button>
      </form>
    </div>
  );
}
