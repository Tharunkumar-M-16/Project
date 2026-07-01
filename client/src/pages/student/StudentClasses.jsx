import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import TestTaker from './TestTaker.jsx';
import { classStatus, statusBadgeClass } from '../../utils/classStatus.js';

// One enrolled class shown Udemy-style: banner, resources (docs) and lessons (tests).
function EnrolledClass({ liveClass }) {
  const [tests, setTests] = useState([]);
  const [active, setActive] = useState(null);

  const loadTests = () =>
    api.get(`/tests/class/${liveClass._id}`).then((r) => setTests(r.data)).catch(() => {});

  useEffect(() => {
    loadTests();
  }, []);

  const st = classStatus(liveClass);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-indigo-500 p-4 text-white">
        <div>
          <p className="text-xs uppercase tracking-wide opacity-80">{liveClass.subject}</p>
          <h3 className="text-lg font-bold">{liveClass.title}</h3>
          <p className="text-sm opacity-90">
            {liveClass.tutor?.name}
            {liveClass.schedule && ` · ${new Date(liveClass.schedule).toLocaleString()}`}
          </p>
        </div>
        {st.canJoin ? (
          <a href={liveClass.meetingLink} target="_blank" rel="noreferrer"
            className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            🎥 Join live
          </a>
        ) : (
          <span className="rounded-lg bg-white/20 px-3 py-2 text-sm font-semibold">
            {st.status === 'ended' ? '⏹ Live ended' : '🕒 ' + new Date(liveClass.schedule).toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {/* Resources */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">📚 Resources</h4>
          {(!liveClass.documents || liveClass.documents.length === 0) && (
            <p className="text-sm text-slate-400">No documents yet.</p>
          )}
          <ul className="space-y-1">
            {liveClass.documents?.map((d) => (
              <li key={d._id || d.url}>
                <a href={d.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600">
                  📄 {d.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Tests / assignments */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">📝 Tests</h4>
          {tests.length === 0 && <p className="text-sm text-slate-400">No tests assigned.</p>}
          <div className="space-y-2">
            {tests.map((t) => (
              <div key={t._id} className="rounded-lg bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.questions.length} questions</p>
                  </div>
                  {t.mySubmission ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {t.mySubmission.percent}% ✓
                    </span>
                  ) : (
                    <button onClick={() => setActive(active === t._id ? null : t._id)} className="btn-primary text-sm">
                      {active === t._id ? 'Close' : 'Take test'}
                    </button>
                  )}
                </div>
                {active === t._id && !t.mySubmission && (
                  <TestTaker test={t} onDone={() => { loadTests(); setActive(null); }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentClasses() {
  const [mine, setMine] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([
      api.get('/classes', { params: { scope: 'mine' } }).then((r) => setMine(r.data)),
      api.get('/classes').then((r) => setAll(r.data)),
    ]);

  useEffect(() => {
    load().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const enroll = async (id) => {
    await api.post(`/classes/${id}/enroll`);
    await load();
  };

  const myIds = new Set(mine.map((c) => c._id));
  const browsable = all.filter((c) => !myIds.has(c._id));

  if (loading) return <div className="card text-slate-400">Loading your classes…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">My classes</h2>
        {mine.length === 0 && (
          <div className="card text-sm text-slate-400">You're not enrolled yet — enroll in a class below.</div>
        )}
        <div className="space-y-4">
          {mine.map((c) => <EnrolledClass key={c._id} liveClass={c} />)}
        </div>
      </div>

      {browsable.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Browse classes</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {browsable.map((c) => {
              const st = classStatus(c);
              return (
                <div key={c._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{c.title}</p>
                    <p className="text-sm text-slate-500">{c.subject} · {c.tutor?.name}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(st.status)}`}>
                      {st.label}
                    </span>
                  </div>
                  <button onClick={() => enroll(c._id)} className="btn-primary text-sm">Enroll</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
