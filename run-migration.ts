import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as dotenv from 'dotenv';

dotenv.config();

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

async function runMigration() {
  try {
    console.log('Starting migration...');

    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  process.exit(0);
}

runMigration();
