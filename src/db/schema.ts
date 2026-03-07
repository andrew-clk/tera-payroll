import { pgTable, text, timestamp, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const partTimerStatusEnum = pgEnum('part_timer_status', ['active', 'inactive']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['clocked-in', 'completed', 'pending']);
export const payrollStatusEnum = pgEnum('payroll_status', ['draft', 'confirmed', 'paid']);

// Part Timers Table
export const partTimers = pgTable('part_timers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ic: text('ic').notNull(),
  contact: text('contact').notNull(),
  bankName: text('bank_name').notNull(),
  bankAccount: text('bank_account').notNull(),
  status: partTimerStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Events Table
export const events = pgTable('events', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  location: text('location'),
  rentalCost: decimal('rental_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Event Daily Assignments Table
export const eventDailyAssignments = pgTable('event_daily_assignments', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  assignedPartTimers: text('assigned_part_timers').array().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Event Staff Salaries Table - stores per-event salary for each part-timer
export const eventStaffSalaries = pgTable('event_staff_salaries', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  partTimerId: text('part_timer_id').notNull().references(() => partTimers.id),
  salary: decimal('salary', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Attendance Table
export const attendance = pgTable('attendance', {
  id: text('id').primaryKey(),
  partTimerId: text('part_timer_id').notNull().references(() => partTimers.id),
  eventId: text('event_id').notNull().references(() => events.id),
  date: text('date').notNull(), // Date of attendance
  clockIn: timestamp('clock_in'),
  clockOut: timestamp('clock_out'),
  clockInPhoto: text('clock_in_photo'), // Base64 image for clock in
  clockOutPhoto: text('clock_out_photo'), // Base64 image for clock out
  hoursWorked: decimal('hours_worked', { precision: 5, scale: 2 }),
  incentive: decimal('incentive', { precision: 10, scale: 2 }).notNull().default('0'),
  status: attendanceStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payroll Table
export const payroll = pgTable('payroll', {
  id: text('id').primaryKey(),
  partTimerId: text('part_timer_id').notNull().references(() => partTimers.id),
  dateRangeStart: text('date_range_start').notNull(),
  dateRangeEnd: text('date_range_end').notNull(),
  eventBreakdown: text('event_breakdown'), // JSON string of event-based pay breakdown
  totalHours: decimal('total_hours', { precision: 8, scale: 2 }).notNull(),
  rate: decimal('rate', { precision: 10, scale: 2 }).notNull(),
  allowance: decimal('allowance', { precision: 10, scale: 2 }).notNull().default('0'),
  incentive: decimal('incentive', { precision: 10, scale: 2 }).notNull().default('0'),
  totalPay: decimal('total_pay', { precision: 10, scale: 2 }).notNull(),
  status: payrollStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports for TypeScript
export type PartTimer = typeof partTimers.$inferSelect;
export type NewPartTimer = typeof partTimers.$inferInsert;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type EventDailyAssignment = typeof eventDailyAssignments.$inferSelect;
export type NewEventDailyAssignment = typeof eventDailyAssignments.$inferInsert;

export type EventStaffSalary = typeof eventStaffSalaries.$inferSelect;
export type NewEventStaffSalary = typeof eventStaffSalaries.$inferInsert;

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;

export type Payroll = typeof payroll.$inferSelect;
export type NewPayroll = typeof payroll.$inferInsert;
