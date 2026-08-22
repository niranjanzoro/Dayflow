import axiosClient, { USE_MOCK } from './axiosClient';
import { delay, loadDB, saveDB } from './mockData';
import { ROLES, EMPLOYEE_STATUS } from '../utils/roles';

function sanitize(user) {
  if (!user) return user;
  const { password, ...safe } = user;
  return safe;
}

export async function getAllEmployees() {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    return db.users.map(sanitize).sort((a, b) => a.name.localeCompare(b.name));
  }
  const { data } = await axiosClient.get('/employees');
  return data;
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
  return data;
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
  const { data } = await axiosClient.put(`/employees/${id}`, updates);
  return data;
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
  return data;
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
  return data;
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
  return data;
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
  return data;
}
