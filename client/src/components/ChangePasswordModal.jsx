import { useState } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ChangePasswordModal({ open, onClose }) {
  const { changePassword } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < 6) return toast.error('New password must be at least 6 characters');
    if (next !== confirm) return toast.error('Passwords do not match');
    setBusy(true);
    try {
      await changePassword(current, next);
      toast.success('Password updated');
      setCurrent(''); setNext(''); setConfirm('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Change password">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Current password</label>
          <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div>
          <label className="label">New password</label>
          <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Update'}</button>
        </div>
      </form>
    </Modal>
  );
}
