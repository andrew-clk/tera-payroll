export interface Event {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  assignedPartTimers: string[];
}

export interface PartTimer {
  id: string;
  name: string;
  ic: string;
  contact: string;
  bankName: string;
  bankAccount: string;
  defaultRate: string | number;
  status: 'active' | 'inactive';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Attendance {
  id: string;
  partTimerId: string;
  eventId: string;
  clockIn: string;
  clockOut?: string | null;
  photoUrl?: string | null;
  hoursWorked?: string | number | null;
  status: 'clocked-in' | 'completed' | 'pending';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Payroll {
  id: string;
  partTimerId: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  totalHours: string | number;
  rate: string | number;
  transportAllowance: string | number;
  mealAllowance: string | number;
  bonus: string | number;
  totalPay: string | number;
  status: 'draft' | 'confirmed' | 'paid';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface DashboardStats {
  totalPartTimers: number;
  activeEvents: number;
  pendingPayroll: number;
  totalPayrollThisMonth: number;
}

// Helper functions for type conversions
export const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
};

export const toString = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return typeof value === 'number' ? value.toString() : value;
};
