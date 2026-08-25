import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Phone, Building2, AlertCircle, CheckCircle2,
  ArrowLeft, ArrowRight, MailCheck, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { verifyEmail, resendVerification } from '../api/authApi';
import { USE_MOCK } from '../api/axiosClient';
import { AuthVisual } from './Login';
import OtpInput from '../components/OtpInput';

const initialForm = {
  name: '', email: '', phone: '', department: '', password: '', confirmPassword: '',
};
const RESEND_SECONDS = 60;

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'•'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

function passwordScore(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Excellent'];

export default function SignUp() {
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = details, 2 = verify
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Verification step
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [demoCode, setDemoCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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
      if (USE_MOCK && result?.verificationCode) setDemoCode(result.verificationCode);
      setCooldown(RESEND_SECONDS);
      setStep(2);
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const doVerify = async (codeToVerify) => {
    setFormError('');
    setVerifying(true);
    try {
      await verifyEmail(form.email.trim(), codeToVerify);
      setVerified(true);
      toast.success('Email verified! Awaiting HR approval.');
      setTimeout(() => navigate('/login', { state: { verified: true } }), 2600);
    } catch (err) {
      setFormError(err.message || 'Verification failed.');
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0 || resending) return;
    setFormError('');
    setResending(true);
    try {
      const result = await resendVerification(form.email.trim());
      if (USE_MOCK && result?.verificationCode) setDemoCode(result.verificationCode);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setFormError(err.message || 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  };

  const strength = passwordScore(form.password);

  return (
    <div className="auth-shell">
      <AuthVisual
        heading="Join your team on Dayflow."
        copy="Create your employee account in a minute - verify your email and you're ready to sign in."
      />

      <div className="auth-panel">
        <div className="auth-form-wrap">
          <div className="steps" aria-label={`Step ${step} of 2`}>
            <div className={`step${step >= 1 ? ' done' : ''}`}>
              <span className="step-dot"><User size={13} /></span>
              <span className="step-label">Details</span>
            </div>
            <div className="step-line" />
            <div className={`step${step >= 2 ? (verified ? ' done' : ' active') : ''}`}>
              <span className="step-dot"><MailCheck size={13} /></span>
              <span className="step-label">Verify</span>
            </div>
          </div>

          {step === 1 && (
            <>
              <h2>Create employee account</h2>
              <p className="sub">Sign-up is for employees. HR/Admin accounts are provisioned by your organization.</p>

              {formError && (
                <div className="form-error-banner"><AlertCircle size={16} />{formError}</div>
              )}

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

                <div className="field-row">
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
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                      className={`input input-action${errors.password ? ' error' : ''}`}
                      placeholder="At least 6 characters" value={form.password}
                      onChange={onChange} autoComplete="new-password" />
                    <button type="button" className="password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span className="field-error">{errors.password}</span>}
                  {form.password && !errors.password && (
                    <div className="strength" aria-live="polite">
                      <span className="strength-bars">
                        {[0, 1, 2, 3].map((i) => (
                          <i key={i} className={`strength-seg s${strength}${strength > i ? ' on' : ''}`} />
                        ))}
                      </span>
                      <span className="strength-text">{STRENGTH_LABELS[strength]}</span>
                    </div>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <div className="input-wrap">
                    <Lock size={16} />
                    <input id="confirmPassword" name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                      className={`input input-action${errors.confirmPassword ? ' error' : ''}`}
                      placeholder="Re-enter password" value={form.confirmPassword}
                      onChange={onChange} autoComplete="new-password" />
                    <button type="button" className="password-toggle"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                </div>

                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                  {submitting ? 'Creating account…' : <>Continue <ArrowRight size={16} /></>}
                </button>
              </form>

              <div className="divider" />
              <p className="auth-alt">
                Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
              </p>
            </>
          )}

          {step === 2 && !verified && (
            <>
              <h2>Verify your email</h2>
              <p className="sub">
                We sent a 6-digit code to <strong className="text-ink">{maskEmail(form.email)}</strong>.
                Enter it below to activate your account.
              </p>

              {formError && (
                <div className="form-error-banner"><AlertCircle size={16} />{formError}</div>
              )}
              {demoCode && (
                <div className="form-info-banner">
                  Demo mode: your verification code is <strong>{demoCode}</strong>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); doVerify(code); }} noValidate>
                <OtpInput
                  value={code}
                  onChange={setCode}
                  onComplete={(full) => doVerify(full)}
                  disabled={verifying}
                />

                <button type="submit" className="btn btn-primary btn-block btn-lg"
                  disabled={verifying || code.length !== 6}>
                  {verifying ? 'Verifying…' : 'Verify email'}
                </button>
              </form>

              <p className="verify-hint">
                Didn&apos;t get the code?{' '}
                {cooldown > 0 ? (
                  <span className="muted">Resend in {cooldown}s</span>
                ) : (
                  <button type="button" className="link-btn" onClick={onResend} disabled={resending}>
                    {resending ? 'Sending…' : 'Resend code'}
                  </button>
                )}
              </p>

              <button type="button" className="back-btn" onClick={() => { setStep(1); setFormError(''); setCode(''); }}>
                <ArrowLeft size={14} /> Edit details
              </button>
            </>
          )}

          {step === 2 && verified && (
            <div className="verify-success">
              <span className="success-ring"><CheckCircle2 size={40} /></span>
              <h2>Email verified</h2>
              <p className="sub">
                One last step: HR needs to approve your account before you can
                sign in. You'll be able to log in as soon as they do.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
