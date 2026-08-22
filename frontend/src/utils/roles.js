// Central place for role/status constants so pages and guards stay in sync.

export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  HR: 'HR', // Admin / HR role
};

export const EMPLOYEE_STATUS = {
  PENDING: 'PENDING',   // just signed up, awaiting HR approval
  ACTIVE: 'ACTIVE',
  DEACTIVATED: 'DEACTIVATED',
};

export const LEAVE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  ON_LEAVE: 'ON_LEAVE',
};
