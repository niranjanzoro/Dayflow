import { useEffect, useState, useCallback, useMemo } from 'react';
import { CalendarX2, LogIn, LogOut as LogOutIcon, Search } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as attendanceApi from '../api/attendanceApi';
import * as employeeApi from '../api/employeeApi';

function StatusBadge({ status }) {
  const map = { PRESENT: 'success', LATE: 'warning', ABSENT: 'danger', ON_LEAVE: 'neutral' };
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status.replace('_', ' ')}</span>;
}

export default function Attendance() {
  const { user, isHR } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [today, setToday] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [clocking, setClocking] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      setLoading(true);
      if (isHR) {
        const [all, emps] = await Promise.all([attendanceApi.getAllAttendance(), employeeApi.getAllEmployees()]);
        if (mounted) {
          setRecords(all);
          setEmployees(emps);
          setLoading(false);
        }
      } else {
        const [mine, t] = await Promise.all([attendanceApi.getMyAttendance(user.id), attendanceApi.getTodayRecord(user.id)]);
        if (mounted) {
          setRecords(mine);
          setToday(t);
          setLoading(false);
        }
      }
    })();
    
    return () => { mounted = false; };
  }, [isHR, user.id]);

  const load = useCallback(async () => {
    setLoading(true);
    if (isHR) {
      const [all, emps] = await Promise.all([attendanceApi.getAllAttendance(), employeeApi.getAllEmployees()]);
      setRecords(all);
      setEmployees(emps);
    } else {
      const [mine, t] = await Promise.all([attendanceApi.getMyAttendance(user.id), attendanceApi.getTodayRecord(user.id)]);
      setRecords(mine);
      setToday(t);
    }
    setLoading(false);
  }, [isHR, user.id]);

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

  const employeeName = (id) => employees.find((e) => e.id === id)?.name || id;

  const filteredRecords = useMemo(() => {
    if (!isHR) return records;
    if (!search.trim()) return records;
    return records.filter((r) => employeeName(r.employeeId).toLowerCase().includes(search.toLowerCase()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, search, employees]);

  return (
    <DashboardLayout title={isHR ? 'Attendance Management' : 'My Attendance'}>
      <div className="page-head">
        <div>
          <h1>{isHR ? 'Attendance Management' : 'My Attendance'}</h1>
          <p className="sub">{isHR ? 'Organization-wide check-in / check-out records.' : 'Your daily check-in and check-out history.'}</p>
        </div>
        {isHR && (
          <div className="input-wrap search-bar">
            <Search size={15} />
            <input className="input" placeholder="Search employee…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        )}
      </div>

      {!isHR && (
        <div className="card mb-xl">
          <div className="row-between wrap gap-16">
            <div className="row gap-28">
              <div>
                <div className="stat-label">Today's check in</div>
                <div className="stat-mono">{today?.checkIn || '--:--'}</div>
              </div>
              <div>
                <div className="stat-label">Today's check out</div>
                <div className="stat-mono">{today?.checkOut || '--:--'}</div>
              </div>
            </div>
            <button
              className={`btn ${today && !today.checkOut ? 'btn-danger' : 'btn-accent'}`}
              onClick={handleClock}
              disabled={clocking || (today && today.checkOut)}
            >
              {today && !today.checkOut ? <LogOutIcon size={16} /> : <LogIn size={16} />}
              {today ? (today.checkOut ? 'Done for today' : 'Clock out') : 'Clock in'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isHR && <th>Employee</th>}
                <th>Date</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={isHR ? 5 : 4} className="cell-center"><div className="spinner" /></td></tr>
              )}
              {!loading && filteredRecords.map((r) => (
                <tr key={r.id}>
                  {isHR && <td className="fw-600">{employeeName(r.employeeId)}</td>}
                  <td className="mono">{r.date}</td>
                  <td className="mono">{r.checkIn || '--:--'}</td>
                  <td className="mono">{r.checkOut || '--:--'}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredRecords.length === 0 && (
            <div className="empty-state">
              <CalendarX2 size={26} />
              <div>No attendance records found.</div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
