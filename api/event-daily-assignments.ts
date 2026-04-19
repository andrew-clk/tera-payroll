import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_db';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, eventId } = req.query as { id?: string; eventId?: string };
  try {
    if (req.method === 'GET') {
      if (eventId) {
        return res.status(200).json(await db.select().from(schema.eventDailyAssignments).where(eq(schema.eventDailyAssignments.eventId, eventId)));
      }
      return res.status(200).json(await db.select().from(schema.eventDailyAssignments));
    }
    if (req.method === 'POST') {
      const result = await db.insert(schema.eventDailyAssignments).values(req.body).returning();
      return res.status(201).json(result[0]);
    }
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id required' });
      const result = await db.update(schema.eventDailyAssignments).set({ ...req.body, updatedAt: new Date() }).where(eq(schema.eventDailyAssignments.id, id)).returning();
      return res.status(200).json(result[0]);
    }
    if (req.method === 'DELETE') {
      if (!eventId) return res.status(400).json({ error: 'eventId required' });
      await db.delete(schema.eventDailyAssignments).where(eq(schema.eventDailyAssignments.eventId, eventId));
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
