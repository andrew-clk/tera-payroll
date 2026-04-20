import { useMemo, useState } from 'react';
import { TrendingUp, Users, Calendar, Clock, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePayroll, usePartTimers, useEvents, useAttendance, useEventStaffSalaries } from '@/hooks/useDatabase';
import { toNumber } from '@/types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const COLORS = ['hsl(234, 89%, 58%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)'];

type Preset = 'this-month' | 'last-month' | 'last-week' | 'last-3-months' | 'all-time' | 'custom';

interface DateRange { from: string; to: string }

function getPresetRange(preset: Preset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'this-month':
      return { from: format(startOfMonth(today), 'yyyy-MM-dd'), to: format(endOfMonth(today), 'yyyy-MM-dd') };
    case 'last-month': {
      const lm = subMonths(today, 1);
      return { from: format(startOfMonth(lm), 'yyyy-MM-dd'), to: format(endOfMonth(lm), 'yyyy-MM-dd') };
    }
    case 'last-week': {
      const lw = subWeeks(today, 1);
      return { from: format(startOfWeek(lw, { weekStartsOn: 1 }), 'yyyy-MM-dd'), to: format(endOfWeek(lw, { weekStartsOn: 1 }), 'yyyy-MM-dd') };
    }
    case 'last-3-months':
      return { from: format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd'), to: format(endOfMonth(today), 'yyyy-MM-dd') };
    case 'all-time':
      return { from: '2000-01-01', to: '2099-12-31' };
    default:
      return { from: format(startOfMonth(today), 'yyyy-MM-dd'), to: format(endOfMonth(today), 'yyyy-MM-dd') };
  }
}

const PRESET_LABELS: Record<Preset, string> = {
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'last-week': 'Last Week',
  'last-3-months': 'Last 3 Months',
  'all-time': 'All Time',
  'custom': 'Custom Range',
};

export default function Reports() {
  const [activePreset, setActivePreset] = useState<Preset>('this-month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const range = useMemo<DateRange>(() => {
    if (activePreset === 'custom' && customFrom && customTo) return { from: customFrom, to: customTo };
    return getPresetRange(activePreset);
  }, [activePreset, customFrom, customTo]);

  const { data: payroll, isLoading: loadingPayroll } = usePayroll();
  const { data: partTimers, isLoading: loadingPartTimers } = usePartTimers();
  const { data: events, isLoading: loadingEvents } = useEvents();
  const { data: attendance, isLoading: loadingAttendance } = useAttendance();
  const { data: staffSalaries, isLoading: loadingStaffSalaries } = useEventStaffSalaries();

  const isLoading = loadingPayroll || loadingPartTimers || loadingEvents || loadingAttendance || loadingStaffSalaries;

  // Filtered slices
  const filteredPayroll = useMemo(() =>
    (payroll ?? []).filter(p =>
      p.dateRangeStart <= range.to && p.dateRangeEnd >= range.from
    ), [payroll, range]);

  const filteredAttendance = useMemo(() =>
    (attendance ?? []).filter(a => a.date >= range.from && a.date <= range.to),
    [attendance, range]);

  const filteredEvents = useMemo(() =>
    (events ?? []).filter(e => e.startDate <= range.to && e.endDate >= range.from),
    [events, range]);

  // Summary stats
  const totalPayroll = useMemo(() =>
    filteredPayroll.reduce((sum, p) => sum + toNumber(p.totalPay), 0),
    [filteredPayroll]);

  const totalHours = useMemo(() =>
    filteredAttendance.filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + toNumber(a.hoursWorked), 0),
    [filteredAttendance]);

  const activePartTimers = useMemo(() =>
    (partTimers ?? []).filter(p => p.status === 'active').length,
    [partTimers]);

  const avgHourlyRate = totalHours > 0 ? totalPayroll / totalHours : 0;

  const completedShiftsCount = useMemo(() =>
    filteredAttendance.filter(a => a.status === 'completed').length,
    [filteredAttendance]);

  // Charts
  const payrollByPartTimer = useMemo(() =>
    (partTimers ?? [])
      .map(pt => {
        const total = filteredPayroll
          .filter(p => p.partTimerId === pt.id)
          .reduce((sum, p) => sum + toNumber(p.totalPay), 0);
        return { name: pt.name.split(' ')[0], fullName: pt.name, total };
      })
      .filter(p => p.total > 0)
      .sort((a, b) => b.total - a.total),
    [filteredPayroll, partTimers]);

  const payrollBreakdown = useMemo(() => {
    const totals = filteredPayroll.reduce(
      (acc, p) => {
        const allowance = toNumber(p.allowance);
        const incentive = toNumber(p.incentive);
        const base = toNumber(p.totalPay) - allowance - incentive;
        return { base: acc.base + Math.max(0, base), allowance: acc.allowance + allowance, incentive: acc.incentive + incentive };
      },
      { base: 0, allowance: 0, incentive: 0 }
    );
    return [
      { name: 'Base Pay', value: totals.base },
      { name: 'Allowance', value: totals.allowance },
      { name: 'Incentive', value: totals.incentive },
    ].filter(d => d.value > 0);
  }, [filteredPayroll]);

  const hoursByPartTimer = useMemo(() =>
    (partTimers ?? [])
      .map(pt => {
        const hours = filteredAttendance
          .filter(a => a.partTimerId === pt.id && a.status === 'completed')
          .reduce((sum, a) => sum + toNumber(a.hoursWorked), 0);
        return { name: pt.name.split(' ')[0], fullName: pt.name, hours };
      })
      .filter(p => p.hours > 0)
      .sort((a, b) => b.hours - a.hours),
    [filteredAttendance, partTimers]);

  const handlePresetSelect = (preset: Preset) => {
    setActivePreset(preset);
    setShowCustom(preset === 'custom');
  };

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

  const rangeLabel = activePreset === 'custom' && customFrom && customTo
    ? `${format(new Date(customFrom), 'MMM d')} – ${format(new Date(customTo), 'MMM d, yyyy')}`
    : activePreset === 'all-time'
      ? 'All Time'
      : `${format(new Date(range.from), 'MMM d')} – ${format(new Date(range.to), 'MMM d, yyyy')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Payroll summaries based on live data</p>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {(['this-month', 'last-month', 'last-week', 'last-3-months'] as Preset[]).map(preset => (
            <Button
              key={preset}
              size="sm"
              variant={activePreset === preset ? 'default' : 'outline'}
              onClick={() => handlePresetSelect(preset)}
              className="text-xs h-8"
            >
              {PRESET_LABELS[preset]}
            </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant={activePreset === 'all-time' || activePreset === 'custom' ? 'default' : 'outline'}
                className="text-xs h-8 gap-1"
              >
                {activePreset === 'all-time' || activePreset === 'custom' ? PRESET_LABELS[activePreset] : 'More'}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlePresetSelect('all-time')}>All Time</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePresetSelect('custom')}>Custom Range</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/40 rounded-xl border border-border">
          <span className="text-sm font-medium text-muted-foreground">Custom range:</span>
          <Input
            type="date"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            className="h-8 w-36 text-sm"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            className="h-8 w-36 text-sm"
          />
        </div>
      )}

      {/* Active range indicator */}
      <p className="text-xs text-muted-foreground -mt-2">
        Showing data for: <span className="font-medium text-foreground">{rangeLabel}</span>
      </p>

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
          <p className="text-xs text-muted-foreground mt-1">{filteredPayroll.length} records</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Total Hours Worked</span>
          </div>
          <p className="text-2xl font-bold">{totalHours.toFixed(1)} hrs</p>
          <p className="text-xs text-muted-foreground mt-1">{completedShiftsCount} completed shifts</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Events in Period</span>
          </div>
          <p className="text-2xl font-bold">{filteredEvents.length}</p>
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
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Total Pay by Part-Timer</h3>
          {payrollByPartTimer.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No payroll data for this period
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payrollByPartTimer} layout="vertical" margin={{ top: 5, right: 40, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `RM${v}`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '14px' }}
                    formatter={(value: number, _: string, props: any) => [`RM ${value.toFixed(2)}`, props.payload.fullName]}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Payroll Breakdown</h3>
          {payrollBreakdown.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No payroll data for this period
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={payrollBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {payrollBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '14px' }}
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
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '14px' }}
                  formatter={(value: number, _: string, props: any) => [`${value.toFixed(2)} hrs`, props.payload.fullName]}
                />
                <Bar dataKey="hours" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-Event Summary Table */}
      {filteredEvents.length > 0 && (
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
                {filteredEvents.map(event => {
                  const eventAtt = filteredAttendance.filter(a => a.eventId === event.id && a.status === 'completed');
                  const completedShifts = eventAtt.length;
                  const hours = eventAtt.reduce((sum, a) => sum + toNumber(a.hoursWorked), 0);
                  const pay = eventAtt.reduce((sum, a) => {
                    const rate = (staffSalaries ?? []).find(s => s.eventId === event.id && s.partTimerId === a.partTimerId);
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
