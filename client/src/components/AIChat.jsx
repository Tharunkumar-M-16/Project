import { useEffect, useRef, useState } from 'react';
import api from '../api/axios.js';

// General AI assistant (OpenAI). Hidden entirely if the server has no API key.
export default function AIChat() {
  const [enabled, setEnabled] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    api.get('/ai/status').then((r) => setEnabled(r.data.enabled)).catch(() => setEnabled(false));
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  if (enabled === null) return null;
  if (!enabled) {
    return (
      <div className="card">
        <h2 className="section-title">✨ Ask AI</h2>
        <p className="mt-2 text-sm text-slate-400">
          AI chat isn't configured on this server. (An admin can set <code>OPENAI_API_KEY</code> to enable it.)
        </p>
      </div>
    );
  }

  const send = async (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    const history = messages.slice(-10);
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setInput('');
    setBusy(true);
    try {
      const { data } = await api.post('/ai/chat', { message: q, history });
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: err.response?.data?.message || 'Sorry, I could not respond right now.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card flex h-[30rem] flex-col">
      <h2 className="section-title mb-2">✨ Ask AI</h2>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">Ask anything — explain a concept, get practice problems, or study tips.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
              m.role === 'user' ? 'bg-brand-600 text-white' : 'surface text-slate-800 dark:text-slate-100'
            }`}>{m.content}</div>
          </div>
        ))}
        {busy && <div className="text-sm text-slate-400">Thinking…</div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input className="input flex-1" placeholder="Ask the assistant…" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-primary" disabled={busy}>Send</button>
      </form>
    </div>
  );
}
