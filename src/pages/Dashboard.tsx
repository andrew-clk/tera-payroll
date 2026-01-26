import { Users, Calendar, Clock, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { getDashboardStats, mockPayroll } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const payrollChartData = [
  { name: 'Oct', amount: 2400 },
  { name: 'Nov', amount: 2800 },
  { name: 'Dec', amount: 3200 },
  { name: 'Jan', amount: 2691 },
];

export default function Dashboard() {
  const stats = getDashboardStats();

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
          value={stats.totalPartTimers}
          subtitle="2 new this month"
          icon={Users}
          variant="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Upcoming Events"
          value={stats.activeEvents}
          subtitle="Next 30 days"
          icon={Calendar}
          variant="info"
        />
        <StatCard
          title="Pending Payroll"
          value={stats.pendingPayroll}
          subtitle="Requires confirmation"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Total Payroll"
          value={`RM ${stats.totalPayrollThisMonth.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
          subtitle="January 2024"
          icon={DollarSign}
          variant="success"
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
            {mockPayroll.filter(p => p.status === 'draft').map((payroll, index) => {
              const partTimer = { name: ['', 'Ahmad bin Ismail', 'Siti Aminah', 'Lee Wei Ming', 'Priya', 'Muhammad Hafiz'][parseInt(payroll.partTimerId)] };
              return (
                <div 
                  key={payroll.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-warning/5 border border-warning/20 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div>
                    <p className="font-medium text-foreground">{partTimer.name}</p>
                    <p className="text-sm text-muted-foreground">{payroll.totalHours} hours • RM{payroll.rate}/hr</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">RM {payroll.totalPay.toFixed(2)}</p>
                    <span className="badge-status badge-pending">Draft</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
