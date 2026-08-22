import axiosClient, { USE_MOCK } from './axiosClient';
import { delay, loadDB, saveDB, uid } from './mockData';

export async function getMyPayroll(employeeId) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    return db.payroll
      .filter((p) => p.employeeId === employeeId)
      .sort((a, b) => (b.year - a.year) || b.month.localeCompare(a.month));
  }
  const { data } = await axiosClient.get('/payroll/me');
  return data ? [normalize(data)] : [];
}

// --- HR / Admin -----------------------------------------------------------

export async function getAllPayroll() {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    return db.payroll.slice().sort((a, b) => (b.year - a.year) || b.month.localeCompare(a.month));
  }
  const { data } = await axiosClient.get('/payroll');
  return data.map(normalize);
}

export async function generatePayroll({ employeeId, month, year, basic, hra, allowances, deductions }) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    const netPay = Number(basic) + Number(hra) + Number(allowances) - Number(deductions);
    const record = {
      id: uid('pay'),
      employeeId,
      month,
      year,
      basic: Number(basic),
      hra: Number(hra),
      allowances: Number(allowances),
      deductions: Number(deductions),
      netPay,
      status: 'PROCESSING',
      paidOn: null,
    };
    db.payroll.unshift(record);
    saveDB(db);
    return record;
  }
  const { data } = await axiosClient.post('/payroll', { employeeId, month, year, basic, hra, allowances, deductions });
  return normalize(data);
}

export async function markPayrollPaid(id) {
  if (USE_MOCK) {
    await delay();
    const db = loadDB();
    const idx = db.payroll.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Payroll record not found.');
    db.payroll[idx].status = 'PAID';
    db.payroll[idx].paidOn = new Date().toISOString().slice(0, 10);
    saveDB(db);
    return db.payroll[idx];
  }
  const { data } = await axiosClient.patch(`/payroll/${id}/mark-paid`);
  return normalize(data);
}

function normalize(payroll) {
  if (!payroll) return payroll;
  const [year, month] = (payroll.payPeriod || '').split('-');
  return { ...payroll, basic: payroll.basic ?? payroll.basicSalary, hra: payroll.hra || 0,
    netPay: payroll.netPay ?? payroll.netSalary, month: payroll.month || new Date(`${year}-${month || '01'}-01`).toLocaleString('en-US', { month: 'long' }),
    year: payroll.year || Number(year) };
}
