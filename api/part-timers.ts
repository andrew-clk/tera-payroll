import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_db.js';
import * as schema from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id?: string };
  try {
    if (req.method === 'GET') {
      if (id) {
        const result = await db.select().from(schema.partTimers).where(eq(schema.partTimers.id, id));
        if (!result[0]) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(result[0]);
      }
      return res.status(200).json(await db.select().from(schema.partTimers));
    }
    if (req.method === 'POST') {
      const result = await db.insert(schema.partTimers).values(req.body).returning();
      return res.status(201).json(result[0]);
    }
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id required' });
      const result = await db.update(schema.partTimers).set({ ...req.body, updatedAt: new Date() }).where(eq(schema.partTimers.id, id)).returning();
      return res.status(200).json(result[0]);
    }
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id required' });
      await db.delete(schema.partTimers).where(eq(schema.partTimers.id, id));
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
