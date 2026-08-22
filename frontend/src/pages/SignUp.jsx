import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { verifyEmail } from '../api/authApi';
import { AuthVisual } from './Login';

const initialForm = {
  name: '', email: '', phone: '', department: '', password: '', confirmPassword: '',
};

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verification, setVerification] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.phone.trim()) next.phone = 'Phone number is required.';
    if (!form.department.trim()) next.department = 'Department is required.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6) next.password = 'Use at least 6 characters.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        department: form.department.trim(),
        designation: 'Employee',
      });
      setVerificationCode(result?.verificationCode || '');
      setSuccess(true);
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setFormError('');
    setVerification(true);
    try {
      await verifyEmail(form.email.trim(), verificationCode);
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      setFormError(err.message || 'Verification failed.');
    } finally {
      setVerification(false);
    }
  };

  return (
    <div className="auth-shell">
      <AuthVisual
        heading="Join your team on Dayflow."
        copy="Create your employee account in a minute. Your HR admin will review and activate it - you'll be ready to sign in right after."
      />

      <div className="auth-panel">
        <div className="auth-form-wrap">
          <h2>Create employee account</h2>
          <p className="sub">Sign-up is for employees. HR/Admin accounts are provisioned by your organization.</p>

          {formError && (
            <div className="form-error-banner"><AlertCircle size={16} />{formError}</div>
          )}
          {success && (
            <div className="form-success-banner">
              <CheckCircle2 size={16} />
              Account created. Enter the verification code to continue.
            </div>
          )}

          {!success && (
            <form onSubmit={onSubmit} noValidate>
              <div className="field">
                <label htmlFor="name">Full name</label>
                <div className="input-wrap">
                  <User size={16} />
                  <input id="name" name="name" className={`input${errors.name ? ' error' : ''}`}
                    placeholder="Jordan Blake" value={form.name} onChange={onChange} autoComplete="name" />
                </div>
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="field">
                <label htmlFor="email">Work email</label>
                <div className="input-wrap">
                  <Mail size={16} />
                  <input id="email" name="email" type="email" className={`input${errors.email ? ' error' : ''}`}
                    placeholder="you@dayflow.com" value={form.email} onChange={onChange} autoComplete="email" />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label htmlFor="phone">Phone</label>
                  <div className="input-wrap">
                    <Phone size={16} />
                    <input id="phone" name="phone" className={`input${errors.phone ? ' error' : ''}`}
                      placeholder="+1 555-0123" value={form.phone} onChange={onChange} autoComplete="tel" />
                  </div>
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
                <div className="field">
                  <label htmlFor="department">Department</label>
                  <div className="input-wrap">
                    <Building2 size={16} />
                    <input id="department" name="department" className={`input${errors.department ? ' error' : ''}`}
                      placeholder="Engineering" value={form.department} onChange={onChange} />
                  </div>
                  {errors.department && <span className="field-error">{errors.department}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <Lock size={16} />
                  <input id="password" name="password" type="password" className={`input${errors.password ? ' error' : ''}`}
                    placeholder="At least 6 characters" value={form.password} onChange={onChange} autoComplete="new-password" />
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <div className="input-wrap">
                  <Lock size={16} />
                  <input id="confirmPassword" name="confirmPassword" type="password" className={`input${errors.confirmPassword ? ' error' : ''}`}
                    placeholder="Re-enter password" value={form.confirmPassword} onChange={onChange} autoComplete="new-password" />
                </div>
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}

          {success && (
            <form onSubmit={verify} noValidate>
              <div className="field">
                <label htmlFor="verificationCode">Email verification code</label>
                <input id="verificationCode" className="input" value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)} placeholder="6-digit code" />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={verification}>
                {verification ? 'Verifying…' : 'Verify email'}
              </button>
            </form>
          )}

          <div className="divider" />
          <p style={{ fontSize: 13.5, textAlign: 'center' }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
