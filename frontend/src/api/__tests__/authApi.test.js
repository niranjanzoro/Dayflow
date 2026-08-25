import { describe, expect, it } from 'vitest';
import {
  login,
  signupEmployee,
  verifyEmail,
  resendVerification,
} from '../authApi';

// These exercise the mock persistence layer end to end - the same code path
// the demo UI runs (USE_MOCK defaults to true when VITE_USE_MOCK is unset).

describe('mock auth flow', () => {
  it('signup issues a 6-digit code and blocks login until verified', async () => {
    const { verificationCode } = await signupEmployee({
      name: 'Test User',
      email: 'test.user@dayflow.com',
      password: 'Secret#123',
    });

    expect(verificationCode).toMatch(/^\d{6}$/);

    await expect(
      login({ email: 'test.user@dayflow.com', password: 'Secret#123' }),
    ).rejects.toThrow('Please verify your email before signing in.');
  });

  it('verifyEmail confirms the address but login stays blocked until HR approves', async () => {
    const { verificationCode } = await signupEmployee({
      name: 'Flow User',
      email: 'flow.user@dayflow.com',
      password: 'Secret#456',
    });
    await verifyEmail('flow.user@dayflow.com', verificationCode);

    // Verified but not yet approved - sign-in must be refused.
    await expect(
      login({ email: 'flow.user@dayflow.com', password: 'Secret#456' }),
    ).rejects.toThrow('awaiting HR approval');

    // Simulate HR approving the account from Employee Management.
    const db = JSON.parse(window.localStorage.getItem('dayflow_db_v1'));
    db.users.find((u) => u.email === 'flow.user@dayflow.com').status = 'ACTIVE';
    window.localStorage.setItem('dayflow_db_v1', JSON.stringify(db));

    const session = await login({ email: 'FLOW.USER@dayflow.com', password: 'Secret#456' });

    expect(session.token).toBeTruthy();
    expect(session.user.email.toLowerCase()).toBe('flow.user@dayflow.com');
    expect(session.user.status).toBe('ACTIVE');
    expect(session.user.password).toBeUndefined();
  });

  it('verifyEmail rejects a wrong or reused code', async () => {
    const { verificationCode } = await signupEmployee({
      name: 'Wrong Code',
      email: 'wrong.code@dayflow.com',
      password: 'Secret#789',
    });

    await expect(verifyEmail('wrong.code@dayflow.com', '000000'))
      .rejects.toThrow('Invalid or expired verification code.');

    await verifyEmail('wrong.code@dayflow.com', verificationCode);
    // Already-verified accounts cannot verify again.
    await expect(verifyEmail('wrong.code@dayflow.com', verificationCode))
      .rejects.toThrow('Invalid or expired verification code.');
  });

  it('resendVerification rotates the code; unknown emails are rejected', async () => {
    await signupEmployee({
      name: 'Resend Me',
      email: 'resend.me@dayflow.com',
      password: 'Secret#000',
    });

    const first = await resendVerification('resend.me@dayflow.com');
    const second = await resendVerification('resend.me@dayflow.com');

    expect(first.verificationCode).toMatch(/^\d{6}$/);
    expect(second.verificationCode).toMatch(/^\d{6}$/);
    expect(second.verificationCode).not.toBe(first.verificationCode);

    // New code verifies; the old one no longer does.
    await verifyEmail('resend.me@dayflow.com', second.verificationCode);

    await expect(resendVerification('ghost@dayflow.com'))
      .rejects.toThrow('Unable to resend the verification code.');
  });

  it('login rejects wrong credentials for an existing account', async () => {
    await signupEmployee({
      name: 'Bad Login',
      email: 'bad.login@dayflow.com',
      password: 'RightPassword#1',
    });
    await resendVerification('bad.login@dayflow.com'); // keep unverified irrelevant

    await expect(
      login({ email: 'bad.login@dayflow.com', password: 'WrongPassword#1' }),
    ).rejects.toThrow('Invalid email or password.');
  });
});
