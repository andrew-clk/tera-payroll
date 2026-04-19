import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_db';
import * as schema from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string };
  try {
    if (req.method === 'PUT') {
      const result = await db.update(schema.eventDailyAssignments)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(schema.eventDailyAssignments.id, id))
        .returning();
      return res.status(200).json(result[0]);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
