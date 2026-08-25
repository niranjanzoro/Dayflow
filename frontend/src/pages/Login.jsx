import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, CalendarCheck, Users, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [notice] = useState(location.state?.verified
    ? 'Email verified. Your account is awaiting HR approval - you can sign in once approved.'
    : '');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'HR' ? '/admin' : '/employee', { replace: true });
    } catch (err) {
      setFormError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <AuthVisual
        heading="Every workday, in flow."
        copy="Track attendance, manage leave, and run payroll for your whole team - HR and employees, one dashboard."
      />

      <div className="auth-panel">
        <div className="auth-form-wrap">
          <h2>Welcome back</h2>
          <p className="sub">Sign in as an employee or HR admin to continue.</p>

          {notice && (
            <div className="form-success-banner">
              <CheckCircle2 size={16} />
              {notice}
            </div>
          )}

          {formError && (
            <div className="form-error-banner">
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Work email</label>
              <div className="input-wrap">
                <Mail size={16} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`input${errors.email ? ' error' : ''}`}
                  placeholder="you@dayflow.com"
                  value={form.email}
                  onChange={onChange}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <Lock size={16} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input input-action${errors.password ? ' error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="row-between mb-lg">
              <Link to="/forgot-password" className="text-sm fw-600">Forgot password?</Link>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="divider" />

          <p className="auth-alt">
            New employee? <Link to="/signup" className="auth-link">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthVisual({ heading, copy }) {
  return (
    <div className="auth-visual">
      <svg className="flow-lines" viewBox="0 0 500 700" preserveAspectRatio="none">
        <path d="M-20 120c40 0 40-70 80-70s40 70 80 70 40-70 80-70 40 70 80 70 40-70 80-70 40-70 80-70"
          stroke="#E1A940" strokeWidth="2" fill="none" opacity="0.5" />
        <path d="M-20 260c40 0 40-70 80-70s40 70 80 70 40-70 80-70 40 70 80 70 40-70 80-70 40 70 80 70 40-70 80-70"
          stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.25" />
        <path d="M-20 560c40 0 40-70 80-70s40 70 80 70 40-70 80-70 40 70 80 70 40-70 80-70 40 70 80 70 40-70 80-70"
          stroke="#E1A940" strokeWidth="2" fill="none" opacity="0.35" />
      </svg>
      <div className="auth-brand">
        <span className="auth-mark">D</span>
        Dayflow HRMS
      </div>
      <div className="auth-copy">
        <h1>{heading}</h1>
        <p>{copy}</p>
        <div className="auth-chips">
          <span className="auth-chip">
            <CalendarCheck size={18} />
            <span><b>Attendance</b><span>Clock in, in one tap</span></span>
          </span>
          <span className="auth-chip">
            <Users size={18} />
            <span><b>Leave</b><span>Approvals in minutes</span></span>
          </span>
          <span className="auth-chip">
            <Wallet size={18} />
            <span><b>Payroll</b><span>Accurate, on time</span></span>
          </span>
        </div>
      </div>
      <div className="auth-foot">© {new Date().getFullYear()} Dayflow. React · Spring Boot · MySQL.</div>
    </div>
  );
}
