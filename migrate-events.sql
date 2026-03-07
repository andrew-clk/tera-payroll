-- Rename 'date' column to 'start_date' in events table
ALTER TABLE events RENAME COLUMN date TO start_date;

-- Add 'end_date' column (default to same as start_date for existing events)
ALTER TABLE events ADD COLUMN end_date text NOT NULL DEFAULT '';
UPDATE events SET end_date = start_date WHERE end_date = '';
ALTER TABLE events ALTER COLUMN end_date DROP DEFAULT;

-- Drop 'assigned_part_timers' column (replaced by event_daily_assignments table)
ALTER TABLE events DROP COLUMN assigned_part_timers;

-- Create event_daily_assignments table
CREATE TABLE IF NOT EXISTS event_daily_assignments (
	id text PRIMARY KEY NOT NULL,
	event_id text NOT NULL,
	date text NOT NULL,
	assigned_part_timers text[] DEFAULT '{}' NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT event_daily_assignments_event_id_events_id_fk
		FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE cascade
);
