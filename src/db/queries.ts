import { db } from './index';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

// Part Timers
export async function getAllPartTimers() {
  return await db.select().from(schema.partTimers);
}

export async function getPartTimerById(id: string) {
  const result = await db.select().from(schema.partTimers).where(eq(schema.partTimers.id, id));
  return result[0];
}

// Events
export async function getAllEvents() {
  return await db.select().from(schema.events);
}

export async function getEventById(id: string) {
  const result = await db.select().from(schema.events).where(eq(schema.events.id, id));
  return result[0];
}

// Attendance
export async function getAllAttendance() {
  return await db.select().from(schema.attendance);
}

export async function getAttendanceById(id: string) {
  const result = await db.select().from(schema.attendance).where(eq(schema.attendance.id, id));
  return result[0];
}

export async function getAttendanceByPartTimer(partTimerId: string) {
  return await db.select().from(schema.attendance).where(eq(schema.attendance.partTimerId, partTimerId));
}

export async function getAttendanceByEvent(eventId: string) {
  return await db.select().from(schema.attendance).where(eq(schema.attendance.eventId, eventId));
}

// Payroll
export async function getAllPayroll() {
  return await db.select().from(schema.payroll);
}

export async function getPayrollById(id: string) {
  const result = await db.select().from(schema.payroll).where(eq(schema.payroll.id, id));
  return result[0];
}

export async function getPayrollByPartTimer(partTimerId: string) {
  return await db.select().from(schema.payroll).where(eq(schema.payroll.partTimerId, partTimerId));
}

// Dashboard Stats
export async function getDashboardStats() {
  const partTimers = await getAllPartTimers();
  const events = await getAllEvents();
  const payrollRecords = await getAllPayroll();

  const activePartTimers = partTimers.filter(p => p.status === 'active').length;
  const activeEvents = events.filter(e => new Date(e.date) >= new Date()).length;
  const pendingPayroll = payrollRecords.filter(p => p.status === 'draft').length;
  const totalPayrollThisMonth = payrollRecords.reduce((sum, p) => sum + parseFloat(p.totalPay), 0);

  return {
    totalPartTimers: activePartTimers,
    activeEvents,
    pendingPayroll,
    totalPayrollThisMonth,
  };
}
