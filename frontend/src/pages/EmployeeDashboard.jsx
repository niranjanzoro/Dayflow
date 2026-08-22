import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, CalendarCheck, CalendarClock, Wallet, LogIn, LogOut as LogOutIcon, ArrowRight,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import * as attendanceApi from '../api/attendanceApi';
import * as leaveApi from '../api/leaveApi';
import * as payrollApi from '../api/payrollApi';
import { LEAVE_STATUS } from '../utils/roles';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(null);
  const [balance, setBalance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [monthAttendance, setMonthAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [clocking, setClocking] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      setLoading(true);
      const [t, bal, lv, att, pay] = await Promise.all([
        attendanceApi.getTodayRecord(user.id),
        leaveApi.getMyLeaveBalance(user.id),
        leaveApi.getMyLeaves(user.id),
        attendanceApi.getMyAttendance(user.id),
        payrollApi.getMyPayroll(user.id),
      ]);
      if (mounted) {
        setToday(t);
        setBalance(bal);
        setLeaves(lv);
        setMonthAttendance(att);
        setPayroll(pay);
        setLoading(false);
      }
    })();
    
    return () => { mounted = false; };
  }, [user.id]);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, bal, lv, att, pay] = await Promise.all([
      attendanceApi.getTodayRecord(user.id),
      leaveApi.getMyLeaveBalance(user.id),
      leaveApi.getMyLeaves(user.id),
      attendanceApi.getMyAttendance(user.id),
      payrollApi.getMyPayroll(user.id),
    ]);
    setToday(t);
    setBalance(bal);
    setLeaves(lv);
    setMonthAttendance(att);
    setPayroll(pay);
    setLoading(false);
  }, [user.id]);

  const handleClock = async () => {
    setClocking(true);
    try {
      if (!today) await attendanceApi.clockIn(user.id);
      else if (!today.checkOut) await attendanceApi.clockOut(user.id);
      await load();
    } finally {
      setClocking(false);
    }
  };

  const thisMonth = new Date().getMonth();
  const presentDays = monthAttendance.filter((a) => new Date(a.date).getMonth() === thisMonth).length;
  const pendingLeaves = leaves.filter((l) => l.status === LEAVE_STATUS.PENDING).length;
  const leaveLeft = balance ? (balance.casual - (balance.used?.casual || 0)) + (balance.sick - (balance.used?.sick || 0)) : 0;
  const latestPay = payroll[0];

  return (
    <DashboardLayout title="My Dashboard">
      <div className="page-head">
        <div>
          <h1>{greeting()}, {user.name.split(' ')[0]}</h1>
          <p className="sub">Here's what's happening with your workday.</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <StatCard icon={CalendarCheck} label="Present days (this month)" value={loading ? '—' : presentDays} />
        <StatCard icon={CalendarClock} label="Leave days remaining" value={loading ? '—' : leaveLeft} accent />
        <StatCard icon={Clock} label="Pending leave requests" value={loading ? '—' : pendingLeaves} />
        <StatCard icon={Wallet} label="Last net pay" value={latestPay ? `$${latestPay.netPay.toLocaleString()}` : '—'} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Today's attendance</div>
          <p style={{ fontSize: 13, marginBottom: 18 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

          <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
            <div>
              <div className="stat-label">Check in</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--primary)' }}>{today?.checkIn || '--:--'}</div>
            </div>
            <div>
              <div className="stat-label">Check out</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--primary)' }}>{today?.checkOut || '--:--'}</div>
            </div>
          </div>

          <button
            className={`btn btn-block ${today && !today.checkOut ? 'btn-danger' : 'btn-accent'}`}
            onClick={handleClock}
            disabled={clocking || (today && today.checkOut)}
          >
            {today && !today.checkOut ? <LogOutIcon size={16} /> : <LogIn size={16} />}
            {clocking ? 'Please wait…' : today ? (today.checkOut ? 'Already clocked out today' : 'Clock out') : 'Clock in'}
          </button>
        </div>

        <div className="card">
          <div className="card-title">Recent leave requests</div>
          <p style={{ fontSize: 13, marginBottom: 14 }}>Your latest leave activity.</p>

          {leaves.length === 0 && <div className="empty-state" style={{ padding: 24 }}>No leave requests yet.</div>}

          {leaves.slice(0, 3).map((l) => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{l.type}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{l.fromDate} → {l.toDate}</div>
              </div>
              <span className={`badge badge-${l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'}`}>
                {l.status}
              </span>
            </div>
          ))}

          <Link to="/employee/leave" className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>
            Manage leave <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
