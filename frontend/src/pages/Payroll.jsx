import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import * as payrollApi from '../api/payrollApi';
import * as employeeApi from '../api/employeeApi';
import { EMPLOYEE_STATUS } from '../utils/roles';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status === 'PAID' ? 'success' : 'warning'}`}>{status}</span>;
}

export default function Payroll() {
  const { user, isHR } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      setLoading(true);
      if (isHR) {
        const [all, emps] = await Promise.all([payrollApi.getAllPayroll(), employeeApi.getAllEmployees()]);
        if (mounted) {
          setPayroll(all);
          setEmployees(emps.filter((e) => e.status === EMPLOYEE_STATUS.ACTIVE));
          setLoading(false);
        }
      } else {
        const mine = await payrollApi.getMyPayroll(user.id);
        if (mounted) {
          setPayroll(mine);
          setLoading(false);
        }
      }
    })();
    
    return () => { mounted = false; };
  }, [isHR, user.id]);

  const load = useCallback(async () => {
    setLoading(true);
    if (isHR) {
      const [all, emps] = await Promise.all([payrollApi.getAllPayroll(), employeeApi.getAllEmployees()]);
      setPayroll(all);
      setEmployees(emps.filter((e) => e.status === EMPLOYEE_STATUS.ACTIVE));
    } else {
      const mine = await payrollApi.getMyPayroll(user.id);
      setPayroll(mine);
    }
    setLoading(false);
  }, [isHR, user.id]);

  const employeeName = (id) => employees.find((e) => e.id === id)?.name || id;

  const markPaid = async (id) => {
    await payrollApi.markPayrollPaid(id);
    await load();
  };

  return (
    <DashboardLayout title={isHR ? 'Payroll Management' : 'My Payroll'}>
      <div className="page-head">
        <div>
          <h1>{isHR ? 'Payroll Management' : 'My Payroll'}</h1>
          <p className="sub">{isHR ? 'Generate and track salary payouts across the team.' : 'View your salary breakdown and payslip history.'}</p>
        </div>
        {isHR && (
          <button className="btn btn-accent" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Generate payroll
          </button>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: isHR ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
        {!isHR && payroll.length > 0 && (
          <div className="card" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}>
            <div className="stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Latest net pay ({payroll[0].month} {payroll[0].year})</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, margin: '6px 0' }}>
              ${payroll[0].netPay.toLocaleString()}
            </div>
            <StatusBadge status={payroll[0].status} />
          </div>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isHR && <th>Employee</th>}
                <th>Period</th>
                <th>Basic</th>
                <th>HRA</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net pay</th>
                <th>Status</th>
                {isHR && <th></th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              )}
              {!loading && payroll.map((p) => (
                <tr key={p.id}>
                  {isHR && <td style={{ fontWeight: 600 }}>{employeeName(p.employeeId)}</td>}
                  <td>{p.month} {p.year}</td>
                  <td className="mono">${p.basic.toLocaleString()}</td>
                  <td className="mono">${p.hra.toLocaleString()}</td>
                  <td className="mono">${p.allowances.toLocaleString()}</td>
                  <td className="mono">-${p.deductions.toLocaleString()}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>${p.netPay.toLocaleString()}</td>
                  <td><StatusBadge status={p.status} /></td>
                  {isHR && (
                    <td>
                      {p.status !== 'PAID' && (
                        <button className="btn btn-sm btn-primary" onClick={() => markPaid(p.id)}>Mark paid</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && payroll.length === 0 && (
            <div className="empty-state">
              <Wallet size={26} />
              <div>No payroll records yet.</div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <GeneratePayrollModal
          employees={employees}
          onClose={() => setShowForm(false)}
          onSubmit={async (payload) => {
            await payrollApi.generatePayroll(payload);
            setShowForm(false);
            await load();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function GeneratePayrollModal({ employees, onClose, onSubmit }) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date();
  const [form, setForm] = useState({
    employeeId: employees[0]?.id || '',
    month: months[now.getMonth()],
    year: now.getFullYear(),
    basic: 3000,
    hra: 1200,
    allowances: 300,
    deductions: 250,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.employeeId) { setError('Select an employee.'); return; }
    setSubmitting(true);
    try {
      await onSubmit(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Could not generate payroll.');
    } finally {
      setSubmitting(false);
    }
  };

  const netPreview = Number(form.basic || 0) + Number(form.hra || 0) + Number(form.allowances || 0) - Number(form.deductions || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ fontSize: 17 }}>Generate payroll</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}><X size={18} /></button>
        </div>

        {error && <div className="form-error-banner"><AlertCircle size={16} />{error}</div>}
        {success && <div className="form-success-banner"><CheckCircle2 size={16} />Payroll generated.</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>Employee</label>
            <select name="employeeId" className="input" value={form.employeeId} onChange={onChange}>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Month</label>
              <select name="month" className="input" value={form.month} onChange={onChange}>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Year</label>
              <input type="number" name="year" className="input" value={form.year} onChange={onChange} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Basic ($)</label>
              <input type="number" name="basic" className="input" value={form.basic} onChange={onChange} />
            </div>
            <div className="field">
              <label>HRA ($)</label>
              <input type="number" name="hra" className="input" value={form.hra} onChange={onChange} />
            </div>
            <div className="field">
              <label>Allowances ($)</label>
              <input type="number" name="allowances" className="input" value={form.allowances} onChange={onChange} />
            </div>
            <div className="field">
              <label>Deductions ($)</label>
              <input type="number" name="deductions" className="input" value={form.deductions} onChange={onChange} />
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg)', padding: 14, marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span style={{ color: 'var(--ink-faint)' }}>Net pay preview</span>
              <strong>${netPreview.toLocaleString()}</strong>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Generating…' : 'Generate'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
