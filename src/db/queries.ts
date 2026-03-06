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

export async function createPartTimer(data: schema.NewPartTimer) {
  const result = await db.insert(schema.partTimers).values(data).returning();
  return result[0];
}

export async function updatePartTimer(id: string, data: Partial<schema.NewPartTimer>) {
  const result = await db.update(schema.partTimers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.partTimers.id, id))
    .returning();
  return result[0];
}

export async function deletePartTimer(id: string) {
  await db.delete(schema.partTimers).where(eq(schema.partTimers.id, id));
}

// Events
export async function getAllEvents() {
  return await db.select().from(schema.events);
}

export async function getEventById(id: string) {
  const result = await db.select().from(schema.events).where(eq(schema.events.id, id));
  return result[0];
}

export async function createEvent(data: schema.NewEvent) {
  const result = await db.insert(schema.events).values(data).returning();
  return result[0];
}

export async function updateEvent(id: string, data: Partial<schema.NewEvent>) {
  const result = await db.update(schema.events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.events.id, id))
    .returning();
  return result[0];
}

export async function deleteEvent(id: string) {
  await db.delete(schema.events).where(eq(schema.events.id, id));
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

export async function createAttendance(data: schema.NewAttendance) {
  const result = await db.insert(schema.attendance).values(data).returning();
  return result[0];
}

export async function updateAttendance(id: string, data: Partial<schema.NewAttendance>) {
  const result = await db.update(schema.attendance)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.attendance.id, id))
    .returning();
  return result[0];
}

export async function deleteAttendance(id: string) {
  await db.delete(schema.attendance).where(eq(schema.attendance.id, id));
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
