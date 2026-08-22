// ---------------------------------------------------------------------------
// Mock persistence layer for Dayflow HRMS (frontend-only mode).
//
// This simulates the Spring Boot + MySQL backend using localStorage so the
// whole app is clickable/demoable before the backend is wired up. Every
// api/*.js file checks `USE_MOCK` (see axiosClient.js) and, when true, calls
// into the helpers below instead of firing a real HTTP request. Swapping to
// the real backend later just means flipping VITE_USE_MOCK=false — no page
// or component code needs to change because the function signatures mirror
// what the real AuthController / EmployeeController / etc. return.
// ---------------------------------------------------------------------------

import { ROLES, EMPLOYEE_STATUS, LEAVE_STATUS, ATTENDANCE_STATUS } from '../utils/roles';

const DB_KEY = 'dayflow_db_v1';

export const delay = (ms = 450) => new Promise((res) => setTimeout(res, ms));

const uid = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

function seedDatabase() {
  const admin = {
    id: 'emp_admin_001',
    name: 'Ava Fontaine',
    email: 'admin@dayflow.com',
    password: 'Admin@123',
    role: ROLES.HR,
    status: EMPLOYEE_STATUS.ACTIVE,
    department: 'Human Resources',
    designation: 'HR Manager',
    phone: '+1 555-0100',
    joinDate: '2022-01-10',
    employeeCode: 'DF-0001',
  };

  const demoEmployees = [
    {
      id: 'emp_1001',
      name: 'Rahul Mehta',
      email: 'rahul.mehta@dayflow.com',
      password: 'Employee@123',
      role: ROLES.EMPLOYEE,
      status: EMPLOYEE_STATUS.ACTIVE,
      department: 'Engineering',
      designation: 'Frontend Developer',
      phone: '+1 555-0111',
      joinDate: '2023-03-14',
      employeeCode: 'DF-0002',
    },
    {
      id: 'emp_1002',
      name: 'Priya Nair',
      email: 'priya.nair@dayflow.com',
      password: 'Employee@123',
      role: ROLES.EMPLOYEE,
      status: EMPLOYEE_STATUS.ACTIVE,
      department: 'Design',
      designation: 'Product Designer',
      phone: '+1 555-0112',
      joinDate: '2023-07-02',
      employeeCode: 'DF-0003',
    },
    {
      id: 'emp_1003',
      name: 'Daniel Cruz',
      email: 'daniel.cruz@dayflow.com',
      password: 'Employee@123',
      role: ROLES.EMPLOYEE,
      status: EMPLOYEE_STATUS.PENDING,
      department: 'Sales',
      designation: 'Account Executive',
      phone: '+1 555-0113',
      joinDate: '2024-11-20',
      employeeCode: 'DF-0004',
    },
  ];

  const today = new Date();
  const attendance = [];
  [demoEmployees[0], demoEmployees[1]].forEach((emp) => {
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const day = d.getDay();
      if (day === 0 || day === 6) continue; // skip weekends
      attendance.push({
        id: uid('att'),
        employeeId: emp.id,
        date: d.toISOString().slice(0, 10),
        checkIn: '09:0' + (2 + (i % 3)),
        checkOut: '18:1' + (i % 5),
        status: i === 3 ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT,
      });
    }
  });

  const leaves = [
    {
      id: uid('lv'),
      employeeId: 'emp_1001',
      type: 'Casual Leave',
      fromDate: new Date(today.getFullYear(), today.getMonth(), 18).toISOString().slice(0, 10),
      toDate: new Date(today.getFullYear(), today.getMonth(), 19).toISOString().slice(0, 10),
      reason: 'Family function',
      status: LEAVE_STATUS.PENDING,
      appliedOn: new Date().toISOString().slice(0, 10),
      reviewedBy: null,
    },
    {
      id: uid('lv'),
      employeeId: 'emp_1002',
      type: 'Sick Leave',
      fromDate: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().slice(0, 10),
      toDate: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().slice(0, 10),
      reason: 'Fever',
      status: LEAVE_STATUS.APPROVED,
      appliedOn: new Date(today.getFullYear(), today.getMonth(), 3).toISOString().slice(0, 10),
      reviewedBy: 'Ava Fontaine',
    },
  ];

  const leaveAllocations = {
    emp_1001: { casual: 12, sick: 8, earned: 15, used: { casual: 2, sick: 0, earned: 0 } },
    emp_1002: { casual: 12, sick: 8, earned: 15, used: { casual: 1, sick: 1, earned: 2 } },
    emp_1003: { casual: 12, sick: 8, earned: 15, used: { casual: 0, sick: 0, earned: 0 } },
  };

  const monthLabel = today.toLocaleString('en-US', { month: 'long' });
  const payroll = [demoEmployees[0], demoEmployees[1]].map((emp, idx) => {
    const basic = 3200 + idx * 400;
    const hra = Math.round(basic * 0.4);
    const allowances = 350;
    const deductions = 260;
    return {
      id: uid('pay'),
      employeeId: emp.id,
      month: monthLabel,
      year: today.getFullYear(),
      basic,
      hra,
      allowances,
      deductions,
      netPay: basic + hra + allowances - deductions,
      status: idx === 0 ? 'PAID' : 'PROCESSING',
      paidOn: idx === 0 ? new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10) : null,
    };
  });

  const db = {
    users: [admin, ...demoEmployees],
    attendance,
    leaves,
    leaveAllocations,
    payroll,
  };

  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

export function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return seedDatabase();
  try {
    return JSON.parse(raw);
  } catch {
    return seedDatabase();
  }
}

export function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

export function resetMockDatabase() {
  localStorage.removeItem(DB_KEY);
  return seedDatabase();
}

export { uid };
