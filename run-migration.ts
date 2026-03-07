import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

async function runMigration() {
  try {
    console.log('Starting migration...');

    // Rename date to start_date
    await db.execute(sql`ALTER TABLE events RENAME COLUMN date TO start_date`);
    console.log('✅ Renamed date column to start_date');

    // Add end_date column
    await db.execute(sql`ALTER TABLE events ADD COLUMN end_date text NOT NULL DEFAULT ''`);
    await db.execute(sql`UPDATE events SET end_date = start_date WHERE end_date = ''`);
    await db.execute(sql`ALTER TABLE events ALTER COLUMN end_date DROP DEFAULT`);
    console.log('✅ Added end_date column');

    // Drop assigned_part_timers column
    await db.execute(sql`ALTER TABLE events DROP COLUMN assigned_part_timers`);
    console.log('✅ Dropped assigned_part_timers column');

    // Create event_daily_assignments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_daily_assignments (
        id text PRIMARY KEY NOT NULL,
        event_id text NOT NULL,
        date text NOT NULL,
        assigned_part_timers text[] DEFAULT '{}' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL,
        CONSTRAINT event_daily_assignments_event_id_events_id_fk
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE cascade
      )
    `);
    console.log('✅ Created event_daily_assignments table');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  process.exit(0);
}

runMigration();
