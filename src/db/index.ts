import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const databaseUrl = import.meta.env.VITE_DATABASE_URL;

if (!databaseUrl) {
  console.warn('VITE_DATABASE_URL is not set — database features will be unavailable');
}

const sql = neon(databaseUrl ?? '');

export const db = drizzle(sql, { schema });
