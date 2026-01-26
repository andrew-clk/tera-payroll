import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Get database URL from environment variable
const databaseUrl = import.meta.env.VITE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

// Create Neon client
const sql = neon(databaseUrl);

// Create Drizzle instance
export const db = drizzle(sql, { schema });
