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
  defaultRate: number;
  status: 'active' | 'inactive';
}

export interface Attendance {
  id: string;
  partTimerId: string;
  eventId: string;
  clockIn: string;
  clockOut?: string;
  photoUrl?: string;
  hoursWorked?: number;
  status: 'clocked-in' | 'completed' | 'pending';
}

export interface Payroll {
  id: string;
  partTimerId: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  totalHours: number;
  rate: number;
  transportAllowance: number;
  mealAllowance: number;
  bonus: number;
  totalPay: number;
  status: 'draft' | 'confirmed' | 'paid';
}

export interface DashboardStats {
  totalPartTimers: number;
  activeEvents: number;
  pendingPayroll: number;
  totalPayrollThisMonth: number;
}
