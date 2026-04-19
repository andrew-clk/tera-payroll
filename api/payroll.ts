import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_db';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, partTimerId } = req.query as { id?: string; partTimerId?: string };
  try {
    if (req.method === 'GET') {
      if (partTimerId) {
        return res.status(200).json(await db.select().from(schema.payroll).where(eq(schema.payroll.partTimerId, partTimerId)));
      }
      if (id) {
        const result = await db.select().from(schema.payroll).where(eq(schema.payroll.id, id));
        if (!result[0]) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(result[0]);
      }
      return res.status(200).json(await db.select().from(schema.payroll));
    }
    if (req.method === 'POST') {
      const result = await db.insert(schema.payroll).values(req.body).returning();
      return res.status(201).json(result[0]);
    }
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id required' });
      const result = await db.update(schema.payroll).set({ ...req.body, updatedAt: new Date() }).where(eq(schema.payroll.id, id)).returning();
      return res.status(200).json(result[0]);
    }
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id required' });
      await db.delete(schema.payroll).where(eq(schema.payroll.id, id));
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
