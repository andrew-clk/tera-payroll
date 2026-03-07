import { db } from './index';
import * as schema from './schema';
import { eq, and } from 'drizzle-orm';

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

// Event Daily Assignments
export async function getAllEventDailyAssignments() {
  return await db.select().from(schema.eventDailyAssignments);
}

export async function getEventDailyAssignments(eventId: string) {
  return await db.select().from(schema.eventDailyAssignments).where(eq(schema.eventDailyAssignments.eventId, eventId));
}

export async function createEventDailyAssignment(data: schema.NewEventDailyAssignment) {
  const result = await db.insert(schema.eventDailyAssignments).values(data).returning();
  return result[0];
}

export async function updateEventDailyAssignment(id: string, data: Partial<schema.NewEventDailyAssignment>) {
  const result = await db.update(schema.eventDailyAssignments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.eventDailyAssignments.id, id))
    .returning();
  return result[0];
}

export async function deleteEventDailyAssignments(eventId: string) {
  await db.delete(schema.eventDailyAssignments).where(eq(schema.eventDailyAssignments.eventId, eventId));
}

// Event Staff Salaries
export async function getEventStaffSalaries(eventId: string) {
  return await db.select().from(schema.eventStaffSalaries).where(eq(schema.eventStaffSalaries.eventId, eventId));
}

export async function createEventStaffSalary(data: schema.NewEventStaffSalary) {
  const result = await db.insert(schema.eventStaffSalaries).values(data).returning();
  return result[0];
}

export async function updateEventStaffSalary(id: string, data: Partial<schema.NewEventStaffSalary>) {
  const result = await db.update(schema.eventStaffSalaries)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.eventStaffSalaries.id, id))
    .returning();
  return result[0];
}

export async function deleteEventStaffSalaries(eventId: string) {
  await db.delete(schema.eventStaffSalaries).where(eq(schema.eventStaffSalaries.eventId, eventId));
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

export async function getAttendanceByPartTimerAndEvent(partTimerId: string, eventId: string) {
  return await db.select().from(schema.attendance)
    .where(and(
      eq(schema.attendance.partTimerId, partTimerId),
      eq(schema.attendance.eventId, eventId)
    ));
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

export async function createPayroll(data: schema.NewPayroll) {
  const result = await db.insert(schema.payroll).values(data).returning();
  return result[0];
}

export async function updatePayroll(id: string, data: Partial<schema.NewPayroll>) {
  const result = await db.update(schema.payroll)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.payroll.id, id))
    .returning();
  return result[0];
}

export async function deletePayroll(id: string) {
  await db.delete(schema.payroll).where(eq(schema.payroll.id, id));
}

// Dashboard Stats
export async function getDashboardStats() {
  const partTimers = await getAllPartTimers();
  const events = await getAllEvents();
  const payrollRecords = await getAllPayroll();

  const activePartTimers = partTimers.filter(p => p.status === 'active').length;
  const activeEvents = events.filter(e => new Date(e.endDate) >= new Date()).length;
  const pendingPayroll = payrollRecords.filter(p => p.status === 'draft').length;
  const totalPayrollThisMonth = payrollRecords.reduce((sum, p) => sum + parseFloat(p.totalPay), 0);

  return {
    totalPartTimers: activePartTimers,
    activeEvents,
    pendingPayroll,
    totalPayrollThisMonth,
  };
}
