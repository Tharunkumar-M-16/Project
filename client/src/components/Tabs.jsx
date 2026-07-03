// Responsive tab navigation: a scrollable top bar on tablet/desktop and a
// fixed bottom nav on mobile — both driven by the same value/onChange.
// tabs: [{ key, icon, label }]
export default function Tabs({ tabs, value, onChange }) {
  return (
    <>
      {/* Desktop / tablet: horizontal, scrolls instead of wrapping */}
      <div className="tab-list no-scrollbar hidden sm:flex">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`tab shrink-0 ${value === t.key ? 'tab-active' : ''}`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Mobile: fixed bottom bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs.map((t) => {
          const active = value === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors active:scale-95 ${
                active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {active && <span className="absolute inset-x-6 top-0 h-[3px] rounded-full bg-brand-500" />}
              <span className={`text-lg leading-none transition-transform duration-200 ${active ? '-translate-y-0.5 scale-110' : ''}`}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
