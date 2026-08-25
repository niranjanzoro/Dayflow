import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, CalendarClock, Wallet, ArrowRight, Check, Ban, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { StatCardSkeleton, ListRowsSkeleton } from '../components/Skeleton';
import { HBarList } from '../components/Charts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as employeeApi from '../api/employeeApi';
import * as leaveApi from '../api/leaveApi';
import * as payrollApi from '../api/payrollApi';
import { EMPLOYEE_STATUS, LEAVE_STATUS } from '../utils/roles';

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
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

  const byDepartment = useMemo(() => {
    const counts = employees.reduce((acc, e) => {
      const dept = e.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [employees]);

  const employeeName = (id) => employees.find((e) => e.id === id)?.name || id;

  const approve = async (employee) => {
    try {
      await employeeApi.approveEmployee(employee.id);
      toast.success(`${employee.name} approved and activated.`);
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not approve the account.');
    }
  };

  const review = async (leaveRequest, status) => {
    try {
      await leaveApi.reviewLeave(leaveRequest.id, status, user.name);
      toast.success(`Leave ${status.toLowerCase()} for ${employeeName(leaveRequest.employeeId)}.`);
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not update the request.');
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="page-head">
        <div>
          <h1>Welcome, {user.name.split(' ')[0]}</h1>
          <p className="sub">Here's the pulse of your organization today.</p>
        </div>
      </div>

      <div className="grid grid-4 mb-lg">
        {loading ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <StatCard icon={Users} label="Total employees" value={employees.length} />
            <StatCard icon={UserCheck} label="Active employees" value={activeCount} accent />
            <StatCard icon={CalendarClock} label="Pending leave requests" value={pendingLeaves.length} />
            <StatCard icon={Wallet} label="Payroll runs pending" value={payrollDue} />
          </>
        )}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Pending employee approvals</div>
          <p className="text-sm mb-md">New sign-ups awaiting HR review before they can sign in.</p>

          {!loading && pendingApprovals.length === 0 && (
            <div className="empty-inline">
              <ShieldCheck size={22} />
              <div>All caught up — no pending sign-ups.</div>
            </div>
          )}

          {loading && <ListRowsSkeleton rows={2} />}

          {!loading && pendingApprovals.map((e) => (
            <div key={e.id} className="list-row">
              <div>
                <div className="text-body-sm">{e.name}</div>
                <div className="text-xs">{e.department} · {e.email}</div>
              </div>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => approve(e)}>
                <Check size={13} /> Approve
              </button>
            </div>
          ))}

          <Link to="/admin/employees" className="btn btn-ghost btn-sm mt-md">
            Manage employees <ArrowRight size={14} />
          </Link>
        </div>

        <div className="card">
          <div className="card-title">Pending leave requests</div>
          <p className="text-sm mb-md">Approve or reject requests awaiting your decision.</p>

          {!loading && pendingLeaves.length === 0 && (
            <div className="empty-inline">No pending leave requests.</div>
          )}

          {loading && <ListRowsSkeleton rows={3} />}

          {!loading && pendingLeaves.slice(0, 5).map((l) => (
            <div key={l.id} className="list-row">
              <div>
                <div className="text-body-sm">{employeeName(l.employeeId)}</div>
                <div className="text-xs">{l.type} · {l.fromDate} → {l.toDate}</div>
              </div>
              <div className="row gap-6">
                <button type="button" className="btn btn-sm btn-primary" aria-label="Approve leave"
                  onClick={() => review(l, LEAVE_STATUS.APPROVED)}><Check size={13} /></button>
                <button type="button" className="btn btn-sm btn-danger" aria-label="Reject leave"
                  onClick={() => review(l, LEAVE_STATUS.REJECTED)}><Ban size={13} /></button>
              </div>
            </div>
          ))}

          <Link to="/admin/leave" className="btn btn-ghost btn-sm mt-md">
            Go to leave approvals <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="card mt-lg">
        <div className="card-title">Headcount by department</div>
        <p className="text-sm mb-md">Where your people are, at a glance.</p>
        {!loading && byDepartment.length > 0 ? (
          <HBarList data={byDepartment} />
        ) : (
          <ListRowsSkeleton rows={3} />
        )}
      </div>
    </DashboardLayout>
  );
}
