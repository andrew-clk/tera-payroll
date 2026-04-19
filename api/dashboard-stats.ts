import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_db.js';
import * as schema from '../src/db/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const [partTimers, events, payrollRecords] = await Promise.all([
      db.select().from(schema.partTimers),
      db.select().from(schema.events),
      db.select().from(schema.payroll),
    ]);

    return res.status(200).json({
      totalPartTimers: partTimers.filter(p => p.status === 'active').length,
      activeEvents: events.filter(e => new Date(e.endDate) >= new Date()).length,
      pendingPayroll: payrollRecords.filter(p => p.status === 'draft').length,
      totalPayrollThisMonth: payrollRecords.reduce((sum, p) => sum + parseFloat(p.totalPay), 0),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
