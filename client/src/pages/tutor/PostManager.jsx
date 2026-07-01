import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import CreateTestForm from './CreateTestForm.jsx';

// One post the tutor owns: shows content + attached tests, with add-test / delete controls.
function PostCard({ post, onChanged }) {
  const [showTest, setShowTest] = useState(false);

  const remove = async () => {
    if (!confirm(`Delete post "${post.title}"? Its tests are removed too.`)) return;
    await api.delete(`/posts/${post._id}`);
    onChanged();
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{post.title}</h3>
          <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString()}</p>
        </div>
        <button onClick={remove} className="text-sm text-rose-500">Delete</button>
      </div>
      {post.body && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{post.body}</p>}

      {post.documents?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {post.documents.map((d) => (
            <a key={d._id} href={d.url} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:text-brand-600">📄 {d.title}</a>
          ))}
        </div>
      )}
      {post.links?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {post.links.map((l) => (
            <a key={l._id} href={l.url} target="_blank" rel="noreferrer" className="rounded-lg bg-indigo-50 px-2 py-1 text-xs text-indigo-700 hover:underline">🔗 {l.label || l.url}</a>
          ))}
        </div>
      )}

      {post.tests?.length > 0 && (
        <div className="mt-3 space-y-1">
          {post.tests.map((t) => (
            <div key={t._id} className="flex justify-between rounded bg-slate-50 px-2 py-1 text-xs">
              <span className="text-slate-600">📝 {t.title}</span>
              <span className="text-slate-400">{t.questions.length} Qs · {t.submissions?.length || 0} subs</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3">
        <button onClick={() => setShowTest((v) => !v)} className="text-sm font-medium text-brand-600">
          {showTest ? 'Cancel' : '+ Attach a test'}
        </button>
        {showTest && (
          <div className="mt-2">
            <CreateTestForm postId={post._id} onCreated={() => { setShowTest(false); onChanged(); }} />
          </div>
        )}
      </div>
    </div>
  );
}

const emptyForm = { title: '', body: '', links: [{ label: '', url: '' }], documents: [{ title: '', url: '' }] };

export default function PostManager() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');

  const load = () => api.get('/posts', { params: { scope: 'mine' } }).then((r) => setPosts(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const setLink = (i, k, v) => setForm({ ...form, links: form.links.map((l, idx) => idx === i ? { ...l, [k]: v } : l) });
  const setDoc = (i, k, v) => setForm({ ...form, documents: form.documents.map((d, idx) => idx === i ? { ...d, [k]: v } : d) });

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/posts', {
        title: form.title,
        body: form.body,
        links: form.links.filter((l) => l.url),
        documents: form.documents.filter((d) => d.title && d.url),
      });
      setMsg('Post published to all students!');
      setForm(emptyForm);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not publish');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Create a post</h2>
        {msg && <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{msg}</div>}
        <input className="input" placeholder="Post title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className="input" rows="3" placeholder="Write something for your students…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />

        <div>
          <label className="label">Documents</label>
          {form.documents.map((d, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input className="input flex-1" placeholder="Title" value={d.title} onChange={(e) => setDoc(i, 'title', e.target.value)} />
              <input className="input flex-1" placeholder="URL" value={d.url} onChange={(e) => setDoc(i, 'url', e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={() => setForm({ ...form, documents: [...form.documents, { title: '', url: '' }] })} className="text-sm text-brand-600">+ Add document</button>
        </div>

        <div>
          <label className="label">Links</label>
          {form.links.map((l, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input className="input flex-1" placeholder="Label" value={l.label} onChange={(e) => setLink(i, 'label', e.target.value)} />
              <input className="input flex-1" placeholder="https://…" value={l.url} onChange={(e) => setLink(i, 'url', e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={() => setForm({ ...form, links: [...form.links, { label: '', url: '' }] })} className="text-sm text-brand-600">+ Add link</button>
        </div>

        <button className="btn-primary">Publish post</button>
        <p className="text-xs text-slate-400">Tip: after publishing, use “+ Attach a test” on the post to add an auto-graded quiz.</p>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">My posts</h2>
        {posts.length === 0 && <p className="text-sm text-slate-400">No posts yet.</p>}
        <div className="space-y-3">
          {posts.map((p) => <PostCard key={p._id} post={p} onChanged={load} />)}
        </div>
      </div>
    </div>
  );
}
