import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios.js';
import CreateTestForm from './CreateTestForm.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

// One post the tutor owns: shows content + attached tests, with add-test / delete controls.
function PostCard({ post, onChanged }) {
  const toast = useToast();
  const [showTest, setShowTest] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success('Post deleted');
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="section-title">{post.title}</h3>
          <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString()}</p>
        </div>
        <button onClick={() => setConfirming(true)} className="btn-danger btn-sm">Delete</button>
      </div>

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Delete post">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Delete <b>{post.title}</b>? Its attached tests are removed too. This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConfirming(false)}>Cancel</button>
          <button className="btn-danger" onClick={remove} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</button>
        </div>
      </Modal>
      {post.body && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{post.body}</p>}

      {post.documents?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.documents.map((d) => (
            <a key={d._id} href={d.url} target="_blank" rel="noreferrer" className="chip bg-slate-100 text-slate-700 hover:text-brand-600 dark:bg-slate-800 dark:text-slate-300">📄 {d.title}</a>
          ))}
        </div>
      )}
      {post.links?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {post.links.map((l) => (
            <a key={l._id} href={l.url} target="_blank" rel="noreferrer" className="chip bg-indigo-50 text-indigo-700 hover:underline dark:bg-indigo-500/20 dark:text-indigo-300">🔗 {l.label || l.url}</a>
          ))}
        </div>
      )}

      {post.tests?.length > 0 && (
        <div className="mt-3 space-y-1">
          {post.tests.map((t) => (
            <div key={t._id} className="flex justify-between rounded-lg surface px-3 py-1.5 text-xs">
              <span className="text-slate-600 dark:text-slate-300">📝 {t.title}</span>
              <span className="text-slate-400">{t.questions.length} Qs · {t.submissions?.length || 0} subs</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <button onClick={() => setShowTest((v) => !v)} className="btn-ghost btn-sm">
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
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () => api.get('/posts', { params: { scope: 'mine' } }).then((r) => setPosts(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const setLink = (i, k, v) => setForm({ ...form, links: form.links.map((l, idx) => idx === i ? { ...l, [k]: v } : l) });
  const setDoc = (i, k, v) => setForm({ ...form, documents: form.documents.map((d, idx) => idx === i ? { ...d, [k]: v } : d) });

  // Upload files and append them as documents on the post being composed.
  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post('/uploads', fd);
        uploaded.push({ title: data.title, url: data.url });
      }
      setForm((f) => ({ ...f, documents: [...f.documents.filter((d) => d.title || d.url), ...uploaded] }));
      toast.success(`Uploaded ${uploaded.length} file(s)`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/posts', {
        title: form.title,
        body: form.body,
        links: form.links.filter((l) => l.url),
        documents: form.documents.filter((d) => d.title && d.url),
      });
      toast.success('Post published to all students!');
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not publish');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card space-y-4">
        <h2 className="section-title">Create a post</h2>
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
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setForm({ ...form, documents: [...form.documents, { title: '', url: '' }] })} className="btn-ghost btn-sm">+ Add link-doc</button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary btn-sm">
              {uploading ? 'Uploading…' : '📎 Upload files'}
            </button>
            <input ref={fileRef} type="file" multiple hidden onChange={onFiles} />
          </div>
        </div>

        <div>
          <label className="label">Links</label>
          {form.links.map((l, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input className="input flex-1" placeholder="Label" value={l.label} onChange={(e) => setLink(i, 'label', e.target.value)} />
              <input className="input flex-1" placeholder="https://…" value={l.url} onChange={(e) => setLink(i, 'url', e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={() => setForm({ ...form, links: [...form.links, { label: '', url: '' }] })} className="btn-ghost btn-sm">+ Add link</button>
        </div>

        <button className="btn-primary" disabled={busy}>{busy ? 'Publishing…' : 'Publish post'}</button>
        <p className="text-xs text-slate-400">Tip: after publishing, use “+ Attach a test” on the post to add an auto-graded quiz.</p>
      </form>

      <div>
        <h2 className="section-title mb-3">My posts</h2>
        {posts.length === 0 && <p className="card !p-8 text-center text-sm text-slate-400 dark:text-slate-500">No posts yet.</p>}
        <div className="space-y-3">
          {posts.map((p) => <PostCard key={p._id} post={p} onChanged={load} />)}
        </div>
      </div>
    </div>
  );
}
