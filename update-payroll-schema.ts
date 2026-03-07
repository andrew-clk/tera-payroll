import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './src/db/schema';
import { sql } from 'drizzle-orm';

config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const client = neon(databaseUrl);
const db = drizzle(client, { schema });

async function updateSchema() {
  console.log('Starting schema updates...');

  try {
    // 1. Remove defaultRate column from part_timers
    console.log('1. Removing defaultRate from part_timers...');
    await db.execute(sql`ALTER TABLE part_timers DROP COLUMN IF EXISTS default_rate`);
    console.log('✓ Removed defaultRate column');

    // 2. Add incentive column to attendance
    console.log('2. Adding incentive to attendance...');
    await db.execute(
      sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS incentive NUMERIC(10, 2) DEFAULT 0 NOT NULL`
    );
    console.log('✓ Added incentive column to attendance');

    // 3. Add new allowance column to payroll (will hold combined transport + meal)
    console.log('3. Adding allowance to payroll...');
    await db.execute(
      sql`ALTER TABLE payroll ADD COLUMN IF NOT EXISTS allowance NUMERIC(10, 2) DEFAULT 0 NOT NULL`
    );
    console.log('✓ Added allowance column to payroll');

    // 4. Merge existing transport and meal allowances into new allowance column
    console.log('4. Merging transport_allowance and meal_allowance into allowance...');
    await db.execute(
      sql`UPDATE payroll SET allowance = COALESCE(transport_allowance, 0) + COALESCE(meal_allowance, 0)`
    );
    console.log('✓ Merged allowances');

    // 5. Rename bonus to incentive in payroll
    console.log('5. Renaming bonus to incentive in payroll...');
    await db.execute(
      sql`ALTER TABLE payroll RENAME COLUMN bonus TO incentive`
    );
    console.log('✓ Renamed bonus to incentive');

    // 6. Drop old transport and meal allowance columns
    console.log('6. Dropping old allowance columns...');
    await db.execute(sql`ALTER TABLE payroll DROP COLUMN IF EXISTS transport_allowance`);
    await db.execute(sql`ALTER TABLE payroll DROP COLUMN IF EXISTS meal_allowance`);
    console.log('✓ Dropped old allowance columns');

    console.log('\n✅ All schema updates completed successfully!');
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    throw error;
  }
}

updateSchema()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
