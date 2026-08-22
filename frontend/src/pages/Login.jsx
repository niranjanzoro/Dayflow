import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
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
                  className={`input${errors.password ? ' error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  autoComplete="current-password"
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 600 }}>Forgot password?</Link>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="divider" />

          <p style={{ fontSize: 13.5, textAlign: 'center' }}>
            New employee? <Link to="/signup" style={{ fontWeight: 700 }}>Create an account</Link>
          </p>

          <div className="card" style={{ marginTop: 22, background: 'var(--bg)', border: '1px dashed var(--border)' }}>
            <p style={{ fontSize: 12, lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--ink)' }}>Demo accounts</strong><br />
              HR admin: admin@dayflow.com / Admin@123<br />
              Employee: rahul.mehta@dayflow.com / Employee@123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthVisual({ heading, copy }) {
  return (
    <div className="auth-visual">
      <svg className="flow-lines" viewBox="0 0 500 700" preserveAspectRatio="none">
        <path d="M-20 120c40 0 40-70 80-70s40 70 80 70 40-70 80-70 40 70 80 70 40-70 80-70 40 70 80 70 40-70 80-70"
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
      </div>
      <div className="auth-foot">© {new Date().getFullYear()} Dayflow. React · Spring Boot · MySQL.</div>
    </div>
  );
}
