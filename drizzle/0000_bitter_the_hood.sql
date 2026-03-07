CREATE TYPE "public"."attendance_status" AS ENUM('clocked-in', 'completed', 'pending');--> statement-breakpoint
CREATE TYPE "public"."part_timer_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."payroll_status" AS ENUM('draft', 'confirmed', 'paid');--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"part_timer_id" text NOT NULL,
	"event_id" text NOT NULL,
	"clock_in" timestamp NOT NULL,
	"clock_out" timestamp,
	"photo_url" text,
	"hours_worked" numeric(5, 2),
	"status" "attendance_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_daily_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"date" text NOT NULL,
	"assigned_part_timers" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "part_timers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"ic" text NOT NULL,
	"contact" text NOT NULL,
	"bank_name" text NOT NULL,
	"bank_account" text NOT NULL,
	"default_rate" numeric(10, 2) NOT NULL,
	"status" "part_timer_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll" (
	"id" text PRIMARY KEY NOT NULL,
	"part_timer_id" text NOT NULL,
	"date_range_start" text NOT NULL,
	"date_range_end" text NOT NULL,
	"total_hours" numeric(8, 2) NOT NULL,
	"rate" numeric(10, 2) NOT NULL,
	"transport_allowance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"meal_allowance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"bonus" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_pay" numeric(10, 2) NOT NULL,
	"status" "payroll_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_part_timer_id_part_timers_id_fk" FOREIGN KEY ("part_timer_id") REFERENCES "public"."part_timers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_daily_assignments" ADD CONSTRAINT "event_daily_assignments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_part_timer_id_part_timers_id_fk" FOREIGN KEY ("part_timer_id") REFERENCES "public"."part_timers"("id") ON DELETE no action ON UPDATE no action;