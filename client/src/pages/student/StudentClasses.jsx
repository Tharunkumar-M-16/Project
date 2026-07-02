import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import TestTaker from './TestTaker.jsx';
import { classStatus, statusBadgeClass } from '../../utils/classStatus.js';
import { useToast } from '../../context/ToastContext.jsx';

// One enrolled class shown Udemy-style: banner, resources (docs) and lessons (tests).
function EnrolledClass({ liveClass, onProgress }) {
  const [tests, setTests] = useState([]);
  const [active, setActive] = useState(null);
  const toast = useToast();

  const loadTests = () =>
    api.get(`/tests/class/${liveClass._id}`).then((r) => setTests(r.data)).catch(() => {});
  useEffect(() => { loadTests(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const st = classStatus(liveClass);

  const join = async () => {
    try {
      const { data } = await api.post(`/classes/${liveClass._id}/attendance`);
      window.open(data.meetingLink || liveClass.meetingLink, '_blank', 'noopener');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not join');
    }
  };

  return (
    <div className="card card-hover !p-0 overflow-hidden animate-fade-up">
      <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-indigo-500 p-5 text-white">
        <div>
          <p className="text-xs uppercase tracking-wide opacity-80">{liveClass.subject}</p>
          <h3 className="text-lg font-bold">{liveClass.title}</h3>
          <p className="text-sm opacity-90">
            {liveClass.tutor?.name}
            {liveClass.schedule && ` · ${new Date(liveClass.schedule).toLocaleString()}`}
          </p>
        </div>
        {st.canJoin ? (
          <button onClick={join} className="btn-secondary btn-sm shrink-0">
            🎥 Join live
          </button>
        ) : (
          <span className="chip shrink-0 bg-white/20 text-white">
            {st.status === 'ended' ? '⏹ Live ended' : '🕒 ' + new Date(liveClass.schedule).toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">📚 Resources</h4>
          {(!liveClass.documents || liveClass.documents.length === 0) && (
            <p className="text-sm text-slate-400">No documents yet.</p>
          )}
          <ul className="space-y-1">
            {liveClass.documents?.map((d) => (
              <li key={d._id || d.url}>
                <a href={d.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl px-2 py-1 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-slate-800">
                  📄 {d.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">📝 Tests</h4>
          {tests.length === 0 && <p className="text-sm text-slate-400">No tests assigned.</p>}
          <div className="space-y-2">
            {tests.map((t) => (
              <div key={t._id} className="surface rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.questions.length} questions</p>
                  </div>
                  {t.mySubmission ? (
                    <span className="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      {t.mySubmission.percent}% ✓
                    </span>
                  ) : (
                    <button onClick={() => setActive(active === t._id ? null : t._id)} className="btn-primary btn-sm">
                      {active === t._id ? 'Close' : 'Take test'}
                    </button>
                  )}
                </div>
                {active === t._id && !t.mySubmission && (
                  <TestTaker test={t} onDone={() => { loadTests(); setActive(null); onProgress?.(); }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentClasses({ compact = false }) {
  const [mine, setMine] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = () =>
    Promise.all([
      api.get('/classes', { params: { scope: 'mine' } }).then((r) => setMine(r.data)),
      compact ? Promise.resolve() : api.get('/classes').then((r) => setAll(r.data)),
    ]);

  useEffect(() => {
    load().catch(() => {}).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const enroll = async (id) => {
    try {
      await api.post(`/classes/${id}/enroll`);
      toast.success('Enrolled!');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not enroll');
    }
  };

  const myIds = new Set(mine.map((c) => c._id));
  const browsable = all.filter((c) => !myIds.has(c._id));

  if (loading) return <div className="card text-center text-slate-400">Loading your classes…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title mb-3">My classes</h2>
        {mine.length === 0 && (
          <div className="card py-10 text-center text-sm text-slate-400">You're not enrolled yet{compact ? '.' : ' — enroll in a class below.'}</div>
        )}
        <div className="space-y-4">
          {mine.map((c) => <EnrolledClass key={c._id} liveClass={c} onProgress={load} />)}
        </div>
      </div>

      {!compact && browsable.length > 0 && (
        <div>
          <h2 className="section-title mb-3">Browse classes</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {browsable.map((c) => {
              const st = classStatus(c);
              return (
                <div key={c._id} className="card card-hover !p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{c.title}</p>
                    <p className="text-sm text-slate-500">{c.subject} · {c.tutor?.name}</p>
                    <span className={`chip mt-1 ${statusBadgeClass(st.status)}`}>
                      {st.label}
                    </span>
                  </div>
                  <button onClick={() => enroll(c._id)} className="btn-primary btn-sm shrink-0">Enroll</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
