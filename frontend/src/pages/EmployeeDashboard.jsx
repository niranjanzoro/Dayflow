import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, CalendarCheck, CalendarClock, Wallet, LogIn, LogOut as LogOutIcon, ArrowRight,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { StatCardSkeleton, ListRowsSkeleton } from '../components/Skeleton';
import { BarChart, HBarList } from '../components/Charts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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
  const toast = useToast();
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
      if (!today) {
        await attendanceApi.clockIn(user.id);
        toast.success('Clocked in. Have a great day!');
      } else if (!today.checkOut) {
        await attendanceApi.clockOut(user.id);
        toast.success('Clocked out. See you tomorrow!');
      }
      await load();
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setClocking(false);
    }
  };

  const thisMonth = new Date().getMonth();
  const presentDays = monthAttendance.filter((a) => new Date(a.date).getMonth() === thisMonth).length;
  const pendingLeaves = leaves.filter((l) => l.status === LEAVE_STATUS.PENDING).length;
  const leaveLeft = balance ? (balance.casual - (balance.used?.casual || 0)) + (balance.sick - (balance.used?.sick || 0)) : 0;
  const latestPay = payroll[0];

  const hoursData = useMemo(() => (
    [...monthAttendance]
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(-7)
      .map((a) => {
        let value = 0;
        if (a.checkIn && a.checkOut) {
          const [h1, m1] = a.checkIn.split(':').map(Number);
          const [h2, m2] = a.checkOut.split(':').map(Number);
          value = Math.round(Math.max((h2 * 60 + m2 - h1 * 60 - m1) / 60, 0) * 10) / 10;
        }
        return {
          label: new Date(a.date).toLocaleDateString('en-US', { weekday: 'short' }),
          value,
        };
      })
  ), [monthAttendance]);

  const leaveUsage = useMemo(() => {
    if (!balance) return [];
    return [
      { label: 'Casual', value: balance.casual, hint: `${balance.casual - (balance.used?.casual || 0)} left` },
      { label: 'Sick', value: balance.sick, hint: `${balance.sick - (balance.used?.sick || 0)} left` },
      { label: 'Earned', value: balance.earned, hint: `${balance.earned - (balance.used?.earned || 0)} left` },
    ];
  }, [balance]);

  return (
    <DashboardLayout title="My Dashboard">
      <div className="page-head">
        <div>
          <h1>{greeting()}, {user.name.split(' ')[0]}</h1>
          <p className="sub">Here's what's happening with your workday.</p>
        </div>
      </div>

      <div className="grid grid-4 mb-lg">
        {loading ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <StatCard icon={CalendarCheck} label="Present days (this month)" value={presentDays} />
            <StatCard icon={CalendarClock} label="Leave days remaining" value={leaveLeft} accent />
            <StatCard icon={Clock} label="Pending leave requests" value={pendingLeaves} />
            <StatCard icon={Wallet} label="Last net pay" value={latestPay ? `$${latestPay.netPay.toLocaleString()}` : '—'} />
          </>
        )}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Today's attendance</div>
          <p className="text-sm mb-lg">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

          <div className="row gap-24 mb-xl">
            <div>
              <div className="stat-label">Check in</div>
              <div className="stat-mono">{today?.checkIn || '--:--'}</div>
            </div>
            <div>
              <div className="stat-label">Check out</div>
              <div className="stat-mono">{today?.checkOut || '--:--'}</div>
            </div>
          </div>

          <button
            className={`btn btn-block ${today && !today.checkOut ? 'btn-danger' : 'btn-accent'}`}
            onClick={handleClock}
            disabled={clocking || loading || (today && today.checkOut)}
          >
            {today && !today.checkOut ? <LogOutIcon size={16} /> : <LogIn size={16} />}
            {clocking ? 'Please wait…' : today ? (today.checkOut ? 'Already clocked out today' : 'Clock out') : 'Clock in'}
          </button>
        </div>

        <div className="card">
          <div className="card-title">Recent leave requests</div>
          <p className="text-sm mb-md">Your latest leave activity.</p>

          {!loading && leaves.length === 0 && (
            <div className="empty-inline">No leave requests yet.</div>
          )}

          {loading && <ListRowsSkeleton rows={3} />}

          {!loading && leaves.slice(0, 3).map((l) => (
            <div key={l.id} className="list-row">
              <div>
                <div className="text-body-sm">{l.type}</div>
                <div className="text-xs">{l.fromDate} → {l.toDate}</div>
              </div>
              <span className={`badge badge-${l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'}`}>
                {l.status}
              </span>
            </div>
          ))}

          <Link to="/employee/leave" className="btn btn-ghost btn-sm mt-md">
            Manage leave <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="grid grid-2 mt-lg">
        <div className="card">
          <div className="card-title">Hours this week</div>
          <p className="text-sm mb-md">Daily hours from your check-in / check-out times.</p>
          {loading ? (
            <ListRowsSkeleton rows={2} />
          ) : hoursData.length > 0 ? (
            <BarChart data={hoursData} formatValue={(v) => `${v}h`} />
          ) : (
            <div className="empty-inline">No attendance data yet.</div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Leave balance</div>
          <p className="text-sm mb-md">Days remaining per leave type.</p>
          {balance ? (
            <HBarList data={leaveUsage} />
          ) : (
            <div className="empty-inline">No balance information yet.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
