import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, CalendarClock, Wallet, ArrowRight, Check, Ban, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import * as employeeApi from '../api/employeeApi';
import * as leaveApi from '../api/leaveApi';
import * as payrollApi from '../api/payrollApi';
import { EMPLOYEE_STATUS, LEAVE_STATUS } from '../utils/roles';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payroll, setPayroll] = useState([]);

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      setLoading(true);
      const [emps, lv, pay] = await Promise.all([
        employeeApi.getAllEmployees(),
        leaveApi.getAllLeaves(),
        payrollApi.getAllPayroll(),
      ]);
      if (mounted) {
        setEmployees(emps);
        setLeaves(lv);
        setPayroll(pay);
        setLoading(false);
      }
    })();
    
    return () => { mounted = false; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [emps, lv, pay] = await Promise.all([
      employeeApi.getAllEmployees(),
      leaveApi.getAllLeaves(),
      payrollApi.getAllPayroll(),
    ]);
    setEmployees(emps);
    setLeaves(lv);
    setPayroll(pay);
    setLoading(false);
  }, []);

  const activeCount = employees.filter((e) => e.status === EMPLOYEE_STATUS.ACTIVE).length;
  const pendingApprovals = employees.filter((e) => e.status === EMPLOYEE_STATUS.PENDING);
  const pendingLeaves = leaves.filter((l) => l.status === LEAVE_STATUS.PENDING);
  const payrollDue = payroll.filter((p) => p.status !== 'PAID').length;

  const employeeName = (id) => employees.find((e) => e.id === id)?.name || id;

  const approve = async (id) => { await employeeApi.approveEmployee(id); await load(); };
  const review = async (id, status) => { await leaveApi.reviewLeave(id, status, user.name); await load(); };

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="page-head">
        <div>
          <h1>Welcome, {user.name.split(' ')[0]}</h1>
          <p className="sub">Here's the pulse of your organization today.</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <StatCard icon={Users} label="Total employees" value={loading ? '—' : employees.length} />
        <StatCard icon={UserCheck} label="Active employees" value={loading ? '—' : activeCount} accent />
        <StatCard icon={CalendarClock} label="Pending leave requests" value={loading ? '—' : pendingLeaves.length} />
        <StatCard icon={Wallet} label="Payroll runs pending" value={loading ? '—' : payrollDue} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div className="card-title">Pending employee approvals</div>
          </div>
          <p style={{ fontSize: 13, marginBottom: 14 }}>New sign-ups awaiting HR review before they can sign in.</p>

          {pendingApprovals.length === 0 && !loading && (
            <div className="empty-state" style={{ padding: 24 }}>
              <ShieldCheck size={22} />
              <div>All caught up — no pending sign-ups.</div>
            </div>
          )}

          {pendingApprovals.map((e) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{e.department} · {e.email}</div>
              </div>
              <button className="btn btn-sm btn-primary" onClick={() => approve(e.id)}>
                <Check size={13} /> Approve
              </button>
            </div>
          ))}

          <Link to="/admin/employees" className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>
            Manage employees <ArrowRight size={14} />
          </Link>
        </div>

        <div className="card">
          <div className="card-title">Pending leave requests</div>
          <p style={{ fontSize: 13, marginBottom: 14 }}>Approve or reject requests awaiting your decision.</p>

          {pendingLeaves.length === 0 && !loading && (
            <div className="empty-state" style={{ padding: 24 }}>No pending leave requests.</div>
          )}

          {pendingLeaves.slice(0, 5).map((l) => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{employeeName(l.employeeId)}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{l.type} · {l.fromDate} → {l.toDate}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm btn-primary" onClick={() => review(l.id, LEAVE_STATUS.APPROVED)}><Check size={13} /></button>
                <button className="btn btn-sm btn-danger" onClick={() => review(l.id, LEAVE_STATUS.REJECTED)}><Ban size={13} /></button>
              </div>
            </div>
          ))}

          <Link to="/admin/leave" className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>
            Go to leave approvals <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
