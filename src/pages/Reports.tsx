import { useMemo } from 'react';
import { TrendingUp, Users, Calendar, Clock, Loader2 } from 'lucide-react';
import { usePayroll, usePartTimers, useEvents, useAttendance, useEventStaffSalaries } from '@/hooks/useDatabase';
import { toNumber } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['hsl(234, 89%, 58%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)'];

export default function Reports() {
  const { data: payroll, isLoading: loadingPayroll } = usePayroll();
  const { data: partTimers, isLoading: loadingPartTimers } = usePartTimers();
  const { data: events, isLoading: loadingEvents } = useEvents();
  const { data: attendance, isLoading: loadingAttendance } = useAttendance();
  const { data: staffSalaries, isLoading: loadingStaffSalaries } = useEventStaffSalaries();

  const isLoading = loadingPayroll || loadingPartTimers || loadingEvents || loadingAttendance || loadingStaffSalaries;

  const totalPayroll = useMemo(() =>
    (payroll ?? []).reduce((sum, p) => sum + toNumber(p.totalPay), 0),
    [payroll]
  );

  const totalHours = useMemo(() =>
    (attendance ?? []).reduce((sum, a) => sum + toNumber(a.hoursWorked), 0),
    [attendance]
  );

  const activePartTimers = useMemo(() =>
    (partTimers ?? []).filter(p => p.status === 'active').length,
    [partTimers]
  );

  const avgHourlyRate = totalHours > 0 ? totalPayroll / totalHours : 0;

  const payrollByPartTimer = useMemo(() => {
    return (partTimers ?? [])
      .map(pt => {
        const total = (payroll ?? [])
          .filter(p => p.partTimerId === pt.id)
          .reduce((sum, p) => sum + toNumber(p.totalPay), 0);
        return { name: pt.name.split(' ')[0], fullName: pt.name, total };
      })
      .filter(p => p.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [payroll, partTimers]);

  const payrollBreakdown = useMemo(() => {
    const totals = (payroll ?? []).reduce(
      (acc, p) => {
        const allowance = toNumber(p.allowance);
        const incentive = toNumber(p.incentive);
        const base = toNumber(p.totalPay) - allowance - incentive;
        return {
          base: acc.base + Math.max(0, base),
          allowance: acc.allowance + allowance,
          incentive: acc.incentive + incentive,
        };
      },
      { base: 0, allowance: 0, incentive: 0 }
    );
    return [
      { name: 'Base Pay', value: totals.base },
      { name: 'Allowance', value: totals.allowance },
      { name: 'Incentive', value: totals.incentive },
    ].filter(d => d.value > 0);
  }, [payroll]);

  const hoursByPartTimer = useMemo(() => {
    return (partTimers ?? [])
      .map(pt => {
        const hours = (attendance ?? [])
          .filter(a => a.partTimerId === pt.id)
          .reduce((sum, a) => sum + toNumber(a.hoursWorked), 0);
        return { name: pt.name.split(' ')[0], fullName: pt.name, hours };
      })
      .filter(p => p.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [attendance, partTimers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Payroll summaries based on live data</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Payroll</span>
          </div>
          <p className="text-2xl font-bold">RM {totalPayroll.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">{(payroll ?? []).length} records</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Total Hours Worked</span>
          </div>
          <p className="text-2xl font-bold">{totalHours.toFixed(1)} hrs</p>
          <p className="text-xs text-muted-foreground mt-1">{(attendance ?? []).filter(a => a.status === 'completed').length} completed shifts</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Total Events</span>
          </div>
          <p className="text-2xl font-bold">{(events ?? []).length}</p>
          <p className="text-xs text-muted-foreground mt-1">{activePartTimers} active part-timers</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-info" />
            </div>
            <span className="text-sm text-muted-foreground">Avg. Pay Rate</span>
          </div>
          <p className="text-2xl font-bold">RM {avgHourlyRate.toFixed(2)}/hr</p>
          <p className="text-xs text-muted-foreground mt-1">total pay ÷ total hours</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll by Part-Timer */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Total Pay by Part-Timer</h3>
          {payrollByPartTimer.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No payroll data yet
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payrollByPartTimer} layout="vertical" margin={{ top: 5, right: 40, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `RM${v}`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                    formatter={(value: number, _: string, props: any) => [
                      `RM ${value.toFixed(2)}`,
                      props.payload.fullName,
                    ]}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payroll Breakdown Pie */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Payroll Breakdown</h3>
          {payrollBreakdown.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No payroll data yet
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payrollBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {payrollBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                    formatter={(value: number) => [`RM ${value.toFixed(2)}`, '']}
                  />
                  <Legend formatter={(value) => <span className="text-sm text-foreground">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Hours by Part-Timer */}
      {hoursByPartTimer.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Hours Worked by Part-Timer</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursByPartTimer} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}h`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  formatter={(value: number, _: string, props: any) => [
                    `${value.toFixed(2)} hrs`,
                    props.payload.fullName,
                  ]}
                />
                <Bar dataKey="hours" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-Event Summary Table */}
      {(events ?? []).length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Event Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Event</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Shifts</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Hours</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Total Pay</th>
                </tr>
              </thead>
              <tbody>
                {(events ?? []).map(event => {
                  const eventAtt = (attendance ?? []).filter(a => a.eventId === event.id && a.status === 'completed');
                  const completedShifts = eventAtt.length;
                  const hours = eventAtt.reduce((sum, a) => sum + toNumber(a.hoursWorked), 0);

                  // Compute pay from attendance × hourly rate per part-timer
                  const pay = eventAtt.reduce((sum, a) => {
                    const rate = (staffSalaries ?? []).find(
                      s => s.eventId === event.id && s.partTimerId === a.partTimerId
                    );
                    return sum + toNumber(a.hoursWorked) * toNumber(rate?.salary);
                  }, 0);

                  if (completedShifts === 0 && hours === 0 && pay === 0) return null;

                  return (
                    <tr key={event.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 font-medium">{event.name}</td>
                      <td className="py-3 px-2 text-right">{completedShifts}</td>
                      <td className="py-3 px-2 text-right">{hours.toFixed(2)} hrs</td>
                      <td className="py-3 px-2 text-right font-medium text-primary">
                        {pay > 0 ? `RM ${pay.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
