import { Download, FileSpreadsheet, FileText, TrendingUp, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePayroll, usePartTimers, useEvents } from '@/hooks/useDatabase';
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

const COLORS = ['hsl(234, 89%, 58%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)'];

export default function Reports() {
  const { data: payrollData = [], isLoading: payrollLoading } = usePayroll();
  const { data: partTimers = [], isLoading: partTimersLoading } = usePartTimers();
  const { data: events = [], isLoading: eventsLoading } = useEvents();

  const isLoading = payrollLoading || partTimersLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  const totalPayroll = payrollData.reduce((sum, p) => sum + parseFloat(p.totalPay), 0);
  const totalHours = payrollData.reduce((sum, p) => sum + parseFloat(String(p.totalHours)), 0);
  const avgHourlyRate = totalHours > 0 ? totalPayroll / totalHours : 0;

  const payrollByPartTimer = partTimers
    .map(pt => {
      const total = payrollData
        .filter(p => p.partTimerId === pt.id)
        .reduce((sum, p) => sum + parseFloat(p.totalPay), 0);
      return { name: pt.name.split(' ')[0], total };
    })
    .filter(p => p.total > 0);

  const payrollByType = [
    { name: 'Base Pay', value: payrollData.reduce((sum, p) => sum + parseFloat(String(p.totalHours)) * parseFloat(String(p.rate)), 0) },
    { name: 'Transport', value: payrollData.reduce((sum, p) => sum + parseFloat(String(p.transportAllowance || 0)), 0) },
    { name: 'Meals', value: payrollData.reduce((sum, p) => sum + parseFloat(String(p.mealAllowance || 0)), 0) },
    { name: 'Bonus', value: payrollData.reduce((sum, p) => sum + parseFloat(String(p.bonus || 0)), 0) },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">View and export payroll summaries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </Button>
          <Button className="gap-2">
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
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
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Total Hours</span>
          </div>
          <p className="text-2xl font-bold">{totalHours.toFixed(1)} hrs</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Events Covered</span>
          </div>
          <p className="text-2xl font-bold">{events.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-info" />
            </div>
            <span className="text-sm text-muted-foreground">Avg. Rate</span>
          </div>
          <p className="text-2xl font-bold">RM {avgHourlyRate.toFixed(2)}/hr</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Payroll by Part-Timer</h3>
          {payrollByPartTimer.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No payroll data yet</div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payrollByPartTimer} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `RM${v}`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '14px' }}
                    formatter={(value: number) => [`RM ${value.toFixed(2)}`, 'Total Pay']}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Payroll Breakdown</h3>
          {payrollByType.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No payroll data yet</div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={payrollByType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {payrollByType.map((_, index) => (
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

      {/* Quick Reports */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Monthly Payroll Summary', desc: 'Complete payroll breakdown by month', icon: FileText },
            { title: 'Part-Timer Hours Report', desc: 'Hours worked by each part-timer', icon: Users },
            { title: 'Event Attendance Report', desc: 'Attendance records for all events', icon: Calendar },
          ].map((report, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <report.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground">{report.title}</h4>
                <p className="text-sm text-muted-foreground">{report.desc}</p>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
