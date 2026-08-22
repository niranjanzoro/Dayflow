import axiosClient, { USE_MOCK } from './axiosClient';
import { delay, loadDB, saveDB, uid } from './mockData';
import { LEAVE_STATUS } from '../utils/roles';

export async function getMyLeaves(employeeId) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    return db.leaves
      .filter((l) => l.employeeId === employeeId)
      .sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
  }
  const { data } = await axiosClient.get('/leaves/me');
  return data;
}

export async function getMyLeaveBalance(employeeId) {
  if (USE_MOCK) {
    await delay(200);
    const db = loadDB();
    return db.leaveAllocations[employeeId] || { casual: 0, sick: 0, earned: 0, used: {} };
  }
  const { data } = await axiosClient.get('/leaves/me/balance');
  return data;
}

export async function applyLeave(employeeId, { type, fromDate, toDate, reason }) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    const record = {
      id: uid('lv'),
      employeeId,
      type,
      fromDate,
      toDate,
      reason,
      status: LEAVE_STATUS.PENDING,
      appliedOn: new Date().toISOString().slice(0, 10),
      reviewedBy: null,
    };
    db.leaves.unshift(record);
    saveDB(db);
    return record;
  }
  const { data } = await axiosClient.post('/leaves', { type, fromDate, toDate, reason });
  return data;
}

export async function cancelLeave(id) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    db.leaves = db.leaves.filter((l) => l.id !== id);
    saveDB(db);
    return { success: true };
  }
  await axiosClient.delete(`/leaves/${id}`);
  return { success: true };
}

// --- HR / Admin -----------------------------------------------------------

export async function getAllLeaves() {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    return db.leaves.slice().sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
  }
  const { data } = await axiosClient.get('/leaves');
  return data;
}

function applyBalanceDeduction(db, leave) {
  const bucketKey = { 'Casual Leave': 'casual', 'Sick Leave': 'sick', 'Earned Leave': 'earned' }[leave.type];
  if (!bucketKey) return;
  const bal = db.leaveAllocations[leave.employeeId];
  if (!bal) return;
  const days = Math.max(
    1,
    Math.round((new Date(leave.toDate) - new Date(leave.fromDate)) / 86400000) + 1
  );
  bal.used[bucketKey] = (bal.used[bucketKey] || 0) + days;
}

export async function reviewLeave(id, status, reviewerName) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    const idx = db.leaves.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Leave request not found.');
    db.leaves[idx].status = status;
    db.leaves[idx].reviewedBy = reviewerName;
    if (status === LEAVE_STATUS.APPROVED) {
      applyBalanceDeduction(db, db.leaves[idx]);
    }
    saveDB(db);
    return db.leaves[idx];
  }
  const { data } = await axiosClient.patch(`/leaves/${id}/review`, { status });
  return data;
}
