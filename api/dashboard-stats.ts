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

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthEndStr = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;

    const thisMonthPayroll = payrollRecords.filter(p =>
      p.dateRangeStart <= monthEndStr && p.dateRangeEnd >= monthStart
    );

    return res.status(200).json({
      totalPartTimers: partTimers.filter(p => p.status === 'active').length,
      activeEvents: events.filter(e => e.endDate >= now.toISOString().slice(0, 10)).length,
      pendingPayroll: payrollRecords.filter(p => p.status === 'draft' || p.status === 'confirmed').length,
      totalPayrollThisMonth: thisMonthPayroll.reduce((sum, p) => sum + parseFloat(p.totalPay), 0),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
