import axiosClient, { USE_MOCK } from './axiosClient';
import { delay, loadDB, saveDB, uid } from './mockData';
import { ROLES, EMPLOYEE_STATUS } from '../utils/roles';

function sanitize(user) {
  if (!user) return user;
  const safe = { ...user };
  delete safe.password;
  return safe;
}

// Not a real JWT (no signing happens client-side) - just a demo token shape
// so the rest of the app (ProtectedRoute, axios interceptor) can treat mock
// mode exactly like the real backend's Bearer token.
function fakeToken(user) {
  return btoa(`${user.id}.${user.role}.${Date.now()}`);
}

export async function login({ email, password }) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password.');
    }
    if (user.emailVerified === false) {
      throw new Error('Please verify your email before signing in.');
    }
    if (user.status === EMPLOYEE_STATUS.PENDING) {
      throw new Error('Your account is awaiting HR approval. Please check back soon.');
    }
    if (user.status === EMPLOYEE_STATUS.DEACTIVATED) {
      throw new Error('Your account has been deactivated. Contact HR for assistance.');
    }
    return { token: fakeToken(user), user: sanitize(user) };
  }

  const { data } = await axiosClient.post('/auth/login', { email, password });
  return data;
}

// Sign up is only ever for employees - HR/Admin accounts are provisioned
// separately (a default HR account is seeded, and HR can promote an
// existing employee to HR from Employee Management).
export async function signupEmployee({ name, email, password, phone, department, designation }) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    const newUser = {
      id: uid('emp'),
      name,
      email,
      password,
      phone: phone || '',
      department: department || 'Unassigned',
      designation: designation || 'Employee',
      role: ROLES.EMPLOYEE,
      status: EMPLOYEE_STATUS.PENDING, // HR must approve before first login
      joinDate: new Date().toISOString().slice(0, 10),
      employeeCode: `DF-${String(db.users.length + 1).padStart(4, '0')}`,
      emailVerified: false,
      verificationCode: mockCode(),
    };
    db.users.push(newUser);
    db.leaveAllocations[newUser.id] = { casual: 12, sick: 8, earned: 15, used: { casual: 0, sick: 0, earned: 0 } };
    saveDB(db);
    // Mock mode has no mailbox - surface the code so the demo stays testable.
    return { verificationCode: newUser.verificationCode };
  }

  const { data } = await axiosClient.post('/auth/signup', {
    name, email, password, phone, department, designation, role: ROLES.EMPLOYEE,
  });
  return data;
}

export async function verifyEmail(email, code) {
  if (USE_MOCK) {
    await delay(700);
    const db = loadDB();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.emailVerified || user.verificationCode !== code.trim()) {
      throw new Error('Invalid or expired verification code.');
    }
    user.emailVerified = true;
    // Verification only proves the email is real - the account stays PENDING
    // until HR approves it from Employee Management. Mirrors the backend.
    delete user.verificationCode;
    saveDB(db);
    return { message: 'Email verified successfully. Your account is awaiting HR approval.' };
  }
  const { data } = await axiosClient.post('/auth/verify-email', { email, code });
  return data;
}

export async function resendVerification(email) {
  if (USE_MOCK) {
    await delay(600);
    const db = loadDB();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.emailVerified) {
      throw new Error('Unable to resend the verification code.');
    }
    user.verificationCode = mockCode();
    saveDB(db);
    return { message: 'A new verification code has been sent.', verificationCode: user.verificationCode };
  }
  const { data } = await axiosClient.post('/auth/resend-verification', { email });
  return data;
}

function mockCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function forgotPassword({ email }) {
  if (USE_MOCK) {
    await delay(600);
    const db = loadDB();
    const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    // Always resolve the same way whether or not the account exists,
    // so the UI never leaks which emails are registered.
    return { sent: true, exists };
  }

  const { data } = await axiosClient.post('/auth/forgot-password', { email });
  return data;
}
