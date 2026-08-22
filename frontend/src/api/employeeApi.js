import axiosClient, { USE_MOCK } from './axiosClient';
import { delay, loadDB, saveDB } from './mockData';
import { ROLES, EMPLOYEE_STATUS } from '../utils/roles';

function sanitize(user) {
  if (!user) return user;
  const safe = { ...user };
  delete safe.password;
  return safe;
}

function normalize(user) {
  if (!user) return user;
  return sanitize({ ...user, designation: user.designation ?? user.jobTitle, joinDate: user.joinDate ?? user.joiningDate,
    employeeCode: user.employeeCode ?? user.employeeId });
}

export async function getAllEmployees() {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    return db.users.map(sanitize).sort((a, b) => a.name.localeCompare(b.name));
  }
  const { data } = await axiosClient.get('/employees');
  return data.map(normalize);
}

export async function getEmployeeById(id) {
  if (USE_MOCK) {
    await delay(250);
    const db = loadDB();
    const user = db.users.find((u) => u.id === id);
    if (!user) throw new Error('Employee not found.');
    return sanitize(user);
  }
  const { data } = await axiosClient.get(`/employees/${id}`);
  return normalize(data);
}

export async function updateProfile(id, updates) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Employee not found.');
    db.users[idx] = { ...db.users[idx], ...updates };
    saveDB(db);
    return sanitize(db.users[idx]);
  }
  const isSelf = String(id) === String(JSON.parse(localStorage.getItem('dayflow_auth') || '{}').user?.id)
    || String(id) === String(JSON.parse(localStorage.getItem('dayflow_auth') || '{}').user?.employeeId);
  const payload = isSelf ? { phone: updates.phone, address: updates.address, profilePicture: updates.profilePicture }
    : { ...updates, jobTitle: updates.designation };
  const { data } = await axiosClient.put(isSelf ? '/employees/me' : `/employees/${id}`, payload);
  return normalize(data);
}

// --- HR / Admin only actions -------------------------------------------------

export async function approveEmployee(id) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Employee not found.');
    db.users[idx].status = EMPLOYEE_STATUS.ACTIVE;
    saveDB(db);
    return sanitize(db.users[idx]);
  }
  const { data } = await axiosClient.post(`/employees/${id}/approve`);
  return normalize(data);
}

export async function setEmployeeStatus(id, status) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Employee not found.');
    db.users[idx].status = status;
    saveDB(db);
    return sanitize(db.users[idx]);
  }
  const { data } = await axiosClient.patch(`/employees/${id}/status`, { status });
  return normalize(data);
}

// Promote an active employee to HR/Admin. Only HR should ever be able to
// call this (also enforced by ProtectedRoute + hiding the control in the UI).
export async function promoteToHR(id) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Employee not found.');
    db.users[idx].role = ROLES.HR;
    saveDB(db);
    return sanitize(db.users[idx]);
  }
  const { data } = await axiosClient.post(`/employees/${id}/promote-to-hr`);
  return normalize(data);
}

export async function demoteToEmployee(id) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Employee not found.');
    db.users[idx].role = ROLES.EMPLOYEE;
    saveDB(db);
    return sanitize(db.users[idx]);
  }
  const { data } = await axiosClient.post(`/employees/${id}/demote-to-employee`);
  return normalize(data);
}
