import { useState } from 'react';
import { Pencil, Save, X, CheckCircle2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import * as employeeApi from '../api/employeeApi';

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Profile() {
  const { user, updateLocalUser, isHR } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name, phone: user.phone || '', department: user.department || '', designation: user.designation || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await employeeApi.updateProfile(user.id, form);
      updateLocalUser(updated);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setEditing(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setForm({ name: user.name, phone: user.phone || '', department: user.department || '', designation: user.designation || '' });
    setEditing(false);
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="page-head">
        <div>
          <h1>My Profile</h1>
          <p className="sub">Your personal and employment details.</p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit profile
          </button>
        )}
      </div>

      {message && (
        <div className={message.type === 'success' ? 'form-success-banner' : 'form-error-banner'}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div className="avatar-lg">{initials(user.name)}</div>
            <div>
              <h2 style={{ fontSize: 18 }}>{user.name}</h2>
              <p style={{ fontSize: 13 }}>{user.designation}</p>
              <span className={`badge ${isHR ? 'badge-accent' : 'badge-neutral'}`} style={{ marginTop: 6, display: 'inline-flex' }}>
                {isHR ? 'HR / Admin' : 'Employee'}
              </span>
            </div>
          </div>

          {!editing ? (
            <div style={{ display: 'grid', gap: 14 }}>
              <ProfileRow label="Full name" value={user.name} />
              <ProfileRow label="Email" value={user.email} />
              <ProfileRow label="Phone" value={user.phone || '—'} />
              <ProfileRow label="Department" value={user.department || '—'} />
              <ProfileRow label="Designation" value={user.designation || '—'} />
              <ProfileRow label="Employee code" value={user.employeeCode} mono />
              <ProfileRow label="Date of joining" value={user.joinDate} mono />
            </div>
          ) : (
            <form onSubmit={onSave}>
              <div className="field">
                <label>Full name</label>
                <input name="name" className="input" value={form.name} onChange={onChange} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input name="phone" className="input" value={form.phone} onChange={onChange} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>Department</label>
                  <input name="department" className="input" value={form.department} onChange={onChange} />
                </div>
                <div className="field">
                  <label>Designation</label>
                  <input name="designation" className="input" value={form.designation} onChange={onChange} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={onCancel}>
                  <X size={15} /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="card">
          <div className="card-title">Account security</div>
          <p style={{ fontSize: 13, marginBottom: 18 }}>Your account is protected with JWT-based authentication.</p>
          <ProfileRow label="Role" value={user.role} />
          <ProfileRow label="Account status" value={user.status} />
          <div className="divider" />
          <p style={{ fontSize: 12.5 }}>
            To change your password, use the <strong>Forgot password</strong> flow from the sign-in screen.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProfileRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, paddingBottom: 10, borderBottom: '1px solid var(--border-soft)' }}>
      <span style={{ color: 'var(--ink-faint)' }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
