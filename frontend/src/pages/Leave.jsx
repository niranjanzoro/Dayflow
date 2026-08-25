import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Check, Ban, CalendarX2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as leaveApi from '../api/leaveApi';
import * as employeeApi from '../api/employeeApi';
import { LEAVE_STATUS } from '../utils/roles';

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave'];

function StatusBadge({ status }) {
  const map = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' };
  return <span className={`badge badge-${map[status]}`}>{status}</span>;
}

export default function Leave() {
  const { user, isHR } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      setLoading(true);
      if (isHR) {
        const [all, emps] = await Promise.all([leaveApi.getAllLeaves(), employeeApi.getAllEmployees()]);
        if (mounted) {
          setLeaves(all);
          setEmployees(emps);
          setLoading(false);
        }
      } else {
        const [mine, bal] = await Promise.all([leaveApi.getMyLeaves(user.id), leaveApi.getMyLeaveBalance(user.id)]);
        if (mounted) {
          setLeaves(mine);
          setBalance(bal);
          setLoading(false);
        }
      }
    })();
    
    return () => { mounted = false; };
  }, [isHR, user.id]);

  const load = useCallback(async () => {
    setLoading(true);
    if (isHR) {
      const [all, emps] = await Promise.all([leaveApi.getAllLeaves(), employeeApi.getAllEmployees()]);
      setLeaves(all);
      setEmployees(emps);
    } else {
      const [mine, bal] = await Promise.all([leaveApi.getMyLeaves(user.id), leaveApi.getMyLeaveBalance(user.id)]);
      setLeaves(mine);
      setBalance(bal);
    }
    setLoading(false);
  }, [isHR, user.id]);

  const employeeName = (id) => employees.find((e) => e.id === id)?.name || id;

  const visibleLeaves = useMemo(() => {
    if (!isHR || filter === 'ALL') return leaves;
    return leaves.filter((l) => l.status === filter);
  }, [leaves, filter, isHR]);

  const review = async (leave, status) => {
    try {
      await leaveApi.reviewLeave(leave.id, status, user.name);
      toast.success(`Leave ${status.toLowerCase()} for ${employeeName(leave.employeeId)}.`);
      await load();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Could not update the request.');
    }
  };

  const cancel = async (id) => {
    await leaveApi.cancelLeave(id);
    toast.info('Leave request cancelled.');
    await load();
  };

  return (
    <DashboardLayout title={isHR ? 'Leave Approvals' : 'Leave Management'}>
      <div className="page-head">
        <div>
          <h1>{isHR ? 'Leave Approvals' : 'Leave Management'}</h1>
          <p className="sub">{isHR ? 'Review and act on employee leave requests.' : 'Apply for leave and track your balance.'}</p>
        </div>
        {!isHR && (
          <button className="btn btn-accent" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Apply for leave
          </button>
        )}
      </div>

      {error && <div className="form-error-banner"><AlertCircle size={16} />{error}</div>}

      {!isHR && balance && (
        <div className="grid grid-3 mb-xl">
          <BalanceCard label="Casual Leave" total={balance.casual} used={balance.used?.casual || 0} />
          <BalanceCard label="Sick Leave" total={balance.sick} used={balance.used?.sick || 0} />
          <BalanceCard label="Earned Leave" total={balance.earned} used={balance.used?.earned || 0} />
        </div>
      )}

      {isHR && (
        <div className="tabs">
          {['ALL', LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED, LEAVE_STATUS.REJECTED].map((f) => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All requests' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isHR && <th>Employee</th>}
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="cell-center"><div className="spinner" /></td></tr>
              )}
              {!loading && visibleLeaves.map((l) => (
                <tr key={l.id}>
                  {isHR && <td className="fw-600">{employeeName(l.employeeId)}</td>}
                  <td>{l.type}</td>
                  <td className="mono">{l.fromDate}</td>
                  <td className="mono">{l.toDate}</td>
                  <td className="max-w-220">{l.reason}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td>
                    {isHR && l.status === LEAVE_STATUS.PENDING && (
                      <div className="row gap-6">
                        <button className="btn btn-sm btn-primary" onClick={() => review(l, LEAVE_STATUS.APPROVED)}>
                          <Check size={13} /> Approve
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => review(l, LEAVE_STATUS.REJECTED)}>
                          <Ban size={13} /> Reject
                        </button>
                      </div>
                    )}
                    {!isHR && l.status === LEAVE_STATUS.PENDING && (
                      <button className="btn btn-sm btn-ghost" onClick={() => cancel(l.id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visibleLeaves.length === 0 && (
            <div className="empty-state">
              <CalendarX2 size={26} />
              <div>No leave requests to show.</div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <ApplyLeaveModal
          onClose={() => setShowForm(false)}
          onSubmit={async (payload) => {
            await leaveApi.applyLeave(user.id, payload);
            setShowForm(false);
            toast.success('Leave request submitted for approval.');
            await load();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function BalanceCard({ label, total, used }) {
  const left = Math.max(total - used, 0);
  const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="card">
      <div className="card-title">{label}</div>
      <div className="row align-baseline gap-6 mt-sm mb-sm">
        <span className="balance-num">{left}</span>
        <span className="text-xs">of {total} days left</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function ApplyLeaveModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ type: LEAVE_TYPES[0], fromDate: '', toDate: '', reason: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.fromDate || !form.toDate) { setError('Please select both dates.'); return; }
    if (new Date(form.toDate) < new Date(form.fromDate)) { setError('End date cannot be before start date.'); return; }
    if (!form.reason.trim()) { setError('Please add a reason.'); return; }
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message || 'Could not submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Apply for leave" onClose={onClose}>
      {error && <div className="form-error-banner"><AlertCircle size={16} />{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>Leave type</label>
            <select name="type" className="input" value={form.type} onChange={onChange}>
              {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label>From</label>
              <input type="date" name="fromDate" className="input" value={form.fromDate} onChange={onChange} />
            </div>
            <div className="field">
              <label>To</label>
              <input type="date" name="toDate" className="input" value={form.toDate} onChange={onChange} />
            </div>
          </div>
          <div className="field">
            <label>Reason</label>
            <textarea name="reason" className="input" rows={3} value={form.reason} onChange={onChange} placeholder="Briefly describe the reason for leave" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit request'}</button>
          </div>
        </form>
    </Modal>
  );
}
