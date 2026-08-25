import { useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as employeeApi from '../api/employeeApi';

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Profile() {
  const { user, updateLocalUser, isHR } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name, phone: user.phone || '', department: user.department || '', designation: user.designation || '',
  });
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await employeeApi.updateProfile(user.id, form);
      updateLocalUser(updated);
      toast.success('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      toast.error(err.message || 'Could not update profile.');
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
          <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit profile
          </button>
        )}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="row gap-16 mb-xl">
            <div className="avatar-lg">{initials(user.name)}</div>
            <div>
              <h2 className="h2-lg">{user.name}</h2>
              <p className="text-sm">{user.designation}</p>
              <span className={`badge ${isHR ? 'badge-accent' : 'badge-neutral'} mt-sm`}>
                {isHR ? 'HR / Admin' : 'Employee'}
              </span>
            </div>
          </div>

          {!editing ? (
            <dl className="stack-form dl-reset">
              <ProfileRow label="Full name" value={user.name} />
              <ProfileRow label="Email" value={user.email} />
              <ProfileRow label="Phone" value={user.phone || '—'} />
              <ProfileRow label="Department" value={user.department || '—'} />
              <ProfileRow label="Designation" value={user.designation || '—'} />
              <ProfileRow label="Employee code" value={user.employeeCode} mono />
              <ProfileRow label="Date of joining" value={user.joinDate} mono />
            </dl>
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
              <div className="field-row">
                <div className="field">
                  <label>Department</label>
                  <input name="department" className="input" value={form.department} onChange={onChange} />
                </div>
                <div className="field">
                  <label>Designation</label>
                  <input name="designation" className="input" value={form.designation} onChange={onChange} />
                </div>
              </div>
              <div className="actions-row">
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
          <p className="text-sm mb-lg">Your account is protected with JWT-based authentication.</p>
          <ProfileRow label="Role" value={user.role} />
          <ProfileRow label="Account status" value={user.status} />
          <div className="divider" />
          <p className="modal-note">
            To change your password, use the <strong>Forgot password</strong> flow from the sign-in screen.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProfileRow({ label, value, mono }) {
  return (
    <div className="kv-row">
      <dt>{label}</dt>
      <dd className={mono ? 'mono' : ''}>{value}</dd>
    </div>
  );
}
