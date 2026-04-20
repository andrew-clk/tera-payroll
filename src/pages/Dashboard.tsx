import { Users, Calendar, Clock, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats, usePayroll, usePartTimers } from '@/hooks/useDatabase';

const payrollChartData = [
  { name: 'Oct', amount: 2400 },
  { name: 'Nov', amount: 2800 },
  { name: 'Dec', amount: 3200 },
  { name: 'Jan', amount: 2691 },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: payrollData, isLoading: payrollLoading } = usePayroll();
  const { data: partTimersData } = usePartTimers();

  if (statsLoading || payrollLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const draftPayroll = payrollData?.filter(p => p.status === 'draft') || [];
  const getPartTimerName = (id: string) => partTimersData?.find(p => p.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's an overview of your payroll system.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Part-Timers"
          value={stats?.totalPartTimers || 0}
          subtitle="2 new this month"
          icon={Users}
          variant="primary"
          trend={{ value: 12, isPositive: true }}
          href="/part-timers"
        />
        <StatCard
          title="Upcoming Events"
          value={stats?.activeEvents || 0}
          subtitle="Next 30 days"
          icon={Calendar}
          variant="info"
          href="/events"
        />
        <StatCard
          title="Pending Payroll"
          value={stats?.pendingPayroll || 0}
          subtitle="Requires confirmation"
          icon={Clock}
          variant="warning"
          href="/payroll"
        />
        <StatCard
          title="Total Payroll"
          value={`RM ${(stats?.totalPayrollThisMonth || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
          subtitle="January 2024"
          icon={DollarSign}
          variant="success"
          href="/reports"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Payroll Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `RM${value}`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  formatter={(value: number) => [`RM ${value.toLocaleString()}`, 'Total Payroll']}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>

      {/* Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEvents />
        
        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Pending Payroll</h3>
          <div className="space-y-3">
            {draftPayroll.map((payroll, index) => (
              <div
                key={payroll.id}
                className="flex items-center justify-between p-4 rounded-lg bg-warning/5 border border-warning/20 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div>
                  <p className="font-medium text-foreground">{getPartTimerName(payroll.partTimerId)}</p>
                  <p className="text-sm text-muted-foreground">{payroll.totalHours} hours • RM{payroll.rate}/hr</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">RM {parseFloat(payroll.totalPay).toFixed(2)}</p>
                  <span className="badge-status badge-pending">Draft</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
