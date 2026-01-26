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
  defaultRate: decimal('default_rate', { precision: 10, scale: 2 }).notNull(),
  status: partTimerStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Events Table
export const events = pgTable('events', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  location: text('location'),
  assignedPartTimers: text('assigned_part_timers').array().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Attendance Table
export const attendance = pgTable('attendance', {
  id: text('id').primaryKey(),
  partTimerId: text('part_timer_id').notNull().references(() => partTimers.id),
  eventId: text('event_id').notNull().references(() => events.id),
  clockIn: timestamp('clock_in').notNull(),
  clockOut: timestamp('clock_out'),
  photoUrl: text('photo_url'),
  hoursWorked: decimal('hours_worked', { precision: 5, scale: 2 }),
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
  totalHours: decimal('total_hours', { precision: 8, scale: 2 }).notNull(),
  rate: decimal('rate', { precision: 10, scale: 2 }).notNull(),
  transportAllowance: decimal('transport_allowance', { precision: 10, scale: 2 }).notNull().default('0'),
  mealAllowance: decimal('meal_allowance', { precision: 10, scale: 2 }).notNull().default('0'),
  bonus: decimal('bonus', { precision: 10, scale: 2 }).notNull().default('0'),
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

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;

export type Payroll = typeof payroll.$inferSelect;
export type NewPayroll = typeof payroll.$inferInsert;
