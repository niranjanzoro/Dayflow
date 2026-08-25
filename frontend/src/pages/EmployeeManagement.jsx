import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Check, ShieldPlus, ShieldMinus, UserX, UserCheck2, Users } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as employeeApi from '../api/employeeApi';
import { ROLES, EMPLOYEE_STATUS } from '../utils/roles';

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function StatusBadge({ status }) {
  const map = { ACTIVE: 'success', PENDING: 'warning', DEACTIVATED: 'danger' };
  return <span className={`badge badge-${map[status]}`}>{status}</span>;
}

const ACTION_TOASTS = {
  approve: (name) => ({ type: 'success', message: `${name} approved and activated.` }),
  promote: (name) => ({ type: 'success', message: `${name} promoted to HR.` }),
  demote: (name) => ({ type: 'info', message: `${name} is now a standard employee.` }),
  deactivate: (name) => ({ type: 'info', message: `${name} has been deactivated.` }),
  reactivate: (name) => ({ type: 'success', message: `${name} has been reactivated.` }),
};

export default function EmployeeManagement() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('ALL');
  const [confirm, setConfirm] = useState(null); // { type, employee }

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      const emps = await employeeApi.getAllEmployees();
      if (mounted) {
        setEmployees(emps);
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const emps = await employeeApi.getAllEmployees();
    setEmployees(emps);
    setLoading(false);
  }, []);

  const pendingCount = employees.filter((e) => e.status === EMPLOYEE_STATUS.PENDING).length;

  const visible = useMemo(() => {
    let list = employees;
    if (tab === 'PENDING') list = list.filter((e) => e.status === EMPLOYEE_STATUS.PENDING);
    if (tab === 'HR') list = list.filter((e) => e.role === ROLES.HR);
    if (tab === 'EMPLOYEE') list = list.filter((e) => e.role === ROLES.EMPLOYEE);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.department.toLowerCase().includes(q));
    }
    return list;
  }, [employees, tab, search]);

  const runAction = async (type, emp) => {
    try {
      if (type === 'approve') await employeeApi.approveEmployee(emp.id);
      if (type === 'promote') await employeeApi.promoteToHR(emp.id);
      if (type === 'demote') await employeeApi.demoteToEmployee(emp.id);
      if (type === 'deactivate') await employeeApi.setEmployeeStatus(emp.id, EMPLOYEE_STATUS.DEACTIVATED);
      if (type === 'reactivate') await employeeApi.setEmployeeStatus(emp.id, EMPLOYEE_STATUS.ACTIVE);
      const t = ACTION_TOASTS[type]?.(emp.name);
      if (t) toast[t.type](t.message);
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || 'Action failed. Please try again.');
    }
  };

  return (
    <DashboardLayout title="Employee Management">
      <div className="page-head">
        <div>
          <h1>Employee Management</h1>
          <p className="sub">Approve new sign-ups, and grant or revoke HR access.</p>
        </div>
        <div className="input-wrap search-bar">
          <Search size={15} />
          <input className="input" placeholder="Search name, email, dept…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tabs">
        <button type="button" className={`tab ${tab === 'ALL' ? 'active' : ''}`} onClick={() => setTab('ALL')}>All ({employees.length})</button>
        <button type="button" className={`tab ${tab === 'PENDING' ? 'active' : ''}`} onClick={() => setTab('PENDING')}>
          Pending approval {pendingCount > 0 ? `(${pendingCount})` : ''}
        </button>
        <button type="button" className={`tab ${tab === 'EMPLOYEE' ? 'active' : ''}`} onClick={() => setTab('EMPLOYEE')}>Employees</button>
        <button type="button" className={`tab ${tab === 'HR' ? 'active' : ''}`} onClick={() => setTab('HR')}>HR / Admin</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="cell-center"><div className="spinner" /></td></tr>
              )}
              {!loading && visible.map((e) => {
                const isSelf = e.id === user.id;
                return (
                  <tr key={e.id}>
                    <td>
                      <div className="row gap-10">
                        <div className="avatar-sm">{initials(e.name)}</div>
                        <div>
                          <div className="text-body-sm">{e.name}{isSelf && <span className="text-xs fw-500"> (you)</span>}</div>
                          <div className="text-xs">{e.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{e.department}</td>
                    <td><span className={`badge ${e.role === ROLES.HR ? 'badge-accent' : 'badge-neutral'}`}>{e.role}</span></td>
                    <td><StatusBadge status={e.status} /></td>
                    <td className="mono">{e.joinDate}</td>
                    <td>
                      <div className="row wrap gap-6 row-end">
                        {e.status === EMPLOYEE_STATUS.PENDING && (
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => runAction('approve', e)}>
                            <Check size={13} /> Approve
                          </button>
                        )}
                        {e.status === EMPLOYEE_STATUS.ACTIVE && e.role === ROLES.EMPLOYEE && (
                          <button type="button" className="btn btn-sm btn-accent" onClick={() => setConfirm({ type: 'promote', employee: e })}>
                            <ShieldPlus size={13} /> Promote to HR
                          </button>
                        )}
                        {e.status === EMPLOYEE_STATUS.ACTIVE && e.role === ROLES.HR && !isSelf && (
                          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirm({ type: 'demote', employee: e })}>
                            <ShieldMinus size={13} /> Remove HR access
                          </button>
                        )}
                        {e.status === EMPLOYEE_STATUS.ACTIVE && !isSelf && (
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => setConfirm({ type: 'deactivate', employee: e })}>
                            <UserX size={13} /> Deactivate
                          </button>
                        )}
                        {e.status === EMPLOYEE_STATUS.DEACTIVATED && (
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => runAction('reactivate', e)}>
                            <UserCheck2 size={13} /> Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && visible.length === 0 && (
            <div className="empty-state">
              <Users size={26} />
              <div>No employees match this view.</div>
            </div>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          type={confirm.type}
          employee={confirm.employee}
          onCancel={() => setConfirm(null)}
          onConfirm={() => runAction(confirm.type, confirm.employee)}
        />
      )}
    </DashboardLayout>
  );
}

const CONFIRM_COPY = {
  promote: (name) => ({ title: 'Promote to HR?', body: `${name} will gain full HR/Admin access, including managing employees, attendance, leave and payroll.`, confirmLabel: 'Promote to HR', confirmClass: 'btn-accent' }),
  demote: (name) => ({ title: 'Remove HR access?', body: `${name} will lose HR/Admin access and return to a standard employee role.`, confirmLabel: 'Remove access', confirmClass: 'btn-danger' }),
  deactivate: (name) => ({ title: 'Deactivate employee?', body: `${name} will no longer be able to sign in until reactivated.`, confirmLabel: 'Deactivate', confirmClass: 'btn-danger' }),
};

function ConfirmModal({ type, employee, onCancel, onConfirm }) {
  const copy = CONFIRM_COPY[type](employee.name);
  return (
    <Modal title={copy.title} onClose={onCancel}>
      <p className="modal-note">{copy.body}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className={`btn ${copy.confirmClass}`} onClick={onConfirm}>{copy.confirmLabel}</button>
      </div>
    </Modal>
  );
}
