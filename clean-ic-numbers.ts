import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { partTimers } from './src/db/schema';
import { sql } from 'drizzle-orm';

// Load environment variables
config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const client = neon(databaseUrl);
const db = drizzle(client);

async function cleanIcNumbers() {
  console.log('Starting to clean IC numbers...');

  try {
    // Update all IC numbers to remove dashes
    const result = await db.execute(
      sql`UPDATE part_timers SET ic = REPLACE(ic, '-', '') WHERE ic LIKE '%-%'`
    );

    console.log('✓ Successfully removed dashes from IC numbers');
    console.log('Updated records:', result.rowCount || 0);

    // Display the updated records
    const allPartTimers = await db.select().from(partTimers);
    console.log('\nCurrent IC numbers:');
    allPartTimers.forEach(pt => {
      console.log(`- ${pt.name}: ${pt.ic}`);
    });

  } catch (error) {
    console.error('Error cleaning IC numbers:', error);
    process.exit(1);
  }

  process.exit(0);
}

cleanIcNumbers();
