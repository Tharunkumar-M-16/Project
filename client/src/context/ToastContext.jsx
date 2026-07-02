import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (message, type = 'info') => {
      const id = ++idCounter;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const toast = {
    info: (m) => push(m, 'info'),
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
  };

  const styles = {
    info: 'bg-slate-900/95 text-white ring-1 ring-white/10 dark:bg-slate-800/95',
    success: 'bg-emerald-600/95 text-white ring-1 ring-emerald-400/30',
    error: 'bg-rose-600/95 text-white ring-1 ring-rose-400/30',
  };
  const icon = { info: 'ℹ️', success: '✓', error: '⚠️' };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            className={`pointer-events-auto flex w-full max-w-sm animate-slide-in cursor-pointer items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lift backdrop-blur ${styles[t.type]}`}
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center text-xs">{icon[t.type]}</span>
            <span className="flex-1 pt-0.5">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
