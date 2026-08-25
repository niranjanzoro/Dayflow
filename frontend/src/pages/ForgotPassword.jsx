import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthVisual } from './Login';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <AuthVisual
        heading="Locked out? We've got you."
        copy="Enter your work email and we'll send a link to reset your password."
      />
      <div className="auth-panel">
        <div className="auth-form-wrap">
          <Link to="/login" className="back-link">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
          <h2>Reset your password</h2>
          <p className="sub">We'll email you a secure reset link.</p>

          {error && <div className="form-error-banner"><AlertCircle size={16} />{error}</div>}
          {sent && (
            <div className="form-success-banner">
              <CheckCircle2 size={16} />
              If an account exists for that email, a reset link is on its way.
            </div>
          )}

          {!sent && (
            <form onSubmit={onSubmit} noValidate>
              <div className="field">
                <label htmlFor="email">Work email</label>
                <div className="input-wrap">
                  <Mail size={16} />
                  <input
                    id="email"
                    type="email"
                    className={`input${error ? ' error' : ''}`}
                    placeholder="you@dayflow.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
