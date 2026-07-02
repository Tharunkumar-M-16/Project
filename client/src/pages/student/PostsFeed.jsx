import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import TestTaker from './TestTaker.jsx';

function PostItem({ post, onTestDone }) {
  const [active, setActive] = useState(null);

  return (
    <div className="card card-hover !p-5 animate-fade-up">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
          {post.tutor?.name?.[0] || 'T'}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{post.tutor?.name || 'Tutor'}</p>
          <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">{post.title}</h3>
      {post.body && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{post.body}</p>}

      {post.documents?.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Documents</p>
          <div className="flex flex-wrap gap-2">
            {post.documents.map((d) => (
              <a key={d._id} href={d.url} target="_blank" rel="noreferrer" className="chip bg-slate-100 text-slate-700 transition hover:text-brand-600 dark:bg-slate-800 dark:text-slate-200">📄 {d.title}</a>
            ))}
          </div>
        </div>
      )}

      {post.links?.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Links</p>
          <div className="flex flex-wrap gap-2">
            {post.links.map((l) => (
              <a key={l._id} href={l.url} target="_blank" rel="noreferrer" className="chip bg-indigo-50 text-indigo-700 transition hover:underline dark:bg-indigo-500/20 dark:text-indigo-300">🔗 {l.label || l.url}</a>
            ))}
          </div>
        </div>
      )}

      {post.tests?.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Tests</p>
          <div className="space-y-2">
            {post.tests.map((t) => (
              <div key={t._id} className="surface rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.questions.length} questions</p>
                  </div>
                  {t.mySubmission ? (
                    <span className="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">{t.mySubmission.percent}% ✓</span>
                  ) : (
                    <button onClick={() => setActive(active === t._id ? null : t._id)} className="btn-primary btn-sm">
                      {active === t._id ? 'Close' : 'Take test'}
                    </button>
                  )}
                </div>
                {active === t._id && !t.mySubmission && (
                  <TestTaker test={t} onDone={() => { setActive(null); onTestDone(); }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PostsFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/posts').then((r) => setPosts(r.data)).catch(() => {});
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  return (
    <div>
      <h2 className="section-title mb-3">📢 Posts from your tutors</h2>
      {loading && <div className="card text-center text-slate-400">Loading posts…</div>}
      {!loading && posts.length === 0 && <div className="card py-10 text-center text-sm text-slate-400">No posts yet.</div>}
      <div className="space-y-4">
        {posts.map((p) => <PostItem key={p._id} post={p} onTestDone={load} />)}
      </div>
    </div>
  );
}
