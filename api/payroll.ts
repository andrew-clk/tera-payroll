import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_db';
import * as schema from '../src/db/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const data = await db.select().from(schema.payroll);
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const result = await db.insert(schema.payroll).values(req.body).returning();
      return res.status(201).json(result[0]);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
