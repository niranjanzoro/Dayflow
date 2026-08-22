import axiosClient, { USE_MOCK } from './axiosClient';
import { delay, loadDB, saveDB, uid } from './mockData';
import { ATTENDANCE_STATUS } from '../utils/roles';

const todayStr = () => new Date().toISOString().slice(0, 10);
const nowStr = () => new Date().toTimeString().slice(0, 5);

export async function getMyAttendance(employeeId) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    return db.attendance
      .filter((a) => a.employeeId === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  const { data } = await axiosClient.get(`/attendance/me`);
  return data;
}

export async function getTodayRecord(employeeId) {
  if (USE_MOCK) {
    await delay(200);
    const db = loadDB();
    return db.attendance.find((a) => a.employeeId === employeeId && a.date === todayStr()) || null;
  }
  const { data } = await axiosClient.get(`/attendance/me/today`);
  return data;
}

export async function clockIn(employeeId) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    const existing = db.attendance.find((a) => a.employeeId === employeeId && a.date === todayStr());
    if (existing) return existing;
    const record = {
      id: uid('att'),
      employeeId,
      date: todayStr(),
      checkIn: nowStr(),
      checkOut: null,
      status: ATTENDANCE_STATUS.PRESENT,
    };
    db.attendance.push(record);
    saveDB(db);
    return record;
  }
  const { data } = await axiosClient.post('/attendance/clock-in');
  return data;
}

export async function clockOut(employeeId) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    const idx = db.attendance.findIndex((a) => a.employeeId === employeeId && a.date === todayStr());
    if (idx === -1) throw new Error('Please clock in first.');
    db.attendance[idx].checkOut = nowStr();
    saveDB(db);
    return db.attendance[idx];
  }
  const { data } = await axiosClient.post('/attendance/clock-out');
  return data;
}

// --- HR / Admin -----------------------------------------------------------

export async function getAllAttendance() {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    return db.attendance.slice().sort((a, b) => b.date.localeCompare(a.date));
  }
  const { data } = await axiosClient.get('/attendance');
  return data;
}
