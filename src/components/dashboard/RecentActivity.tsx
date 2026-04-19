import { Clock, UserCheck, Calendar, DollarSign, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAttendance, usePartTimers, useEvents, usePayroll } from '@/hooks/useDatabase';
import { formatDistanceToNow } from 'date-fns';

type ActivityType = 'clock-in' | 'clock-out' | 'event' | 'payroll';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: Date;
}

const iconMap = {
  'clock-in': UserCheck,
  'clock-out': Clock,
  event: Calendar,
  payroll: DollarSign,
};

const colorMap = {
  'clock-in': 'bg-success/10 text-success',
  'clock-out': 'bg-info/10 text-info',
  event: 'bg-primary/10 text-primary',
  payroll: 'bg-warning/10 text-warning',
};

export function RecentActivity() {
  const { data: attendance = [] } = useAttendance();
  const { data: partTimers = [] } = usePartTimers();
  const { data: events = [] } = useEvents();
  const { data: payroll = [] } = usePayroll();

  const getPartTimerName = (id: string) => partTimers.find(p => p.id === id)?.name || 'Unknown';
  const getEventName = (id: string) => events.find(e => e.id === id)?.name || 'Unknown Event';

  const activities: ActivityItem[] = [];

  attendance.forEach(a => {
    if (a.clockIn) {
      activities.push({
        id: `ci-${a.id}`,
        type: 'clock-in',
        title: `${getPartTimerName(a.partTimerId)} clocked in`,
        description: getEventName(a.eventId),
        time: new Date(a.clockIn),
      });
    }
    if (a.clockOut) {
      activities.push({
        id: `co-${a.id}`,
        type: 'clock-out',
        title: `${getPartTimerName(a.partTimerId)} clocked out`,
        description: getEventName(a.eventId),
        time: new Date(a.clockOut),
      });
    }
  });

  payroll.forEach(p => {
    if (p.status === 'confirmed' && p.updatedAt) {
      activities.push({
        id: `pr-${p.id}`,
        type: 'payroll',
        title: 'Payroll confirmed',
        description: `${getPartTimerName(p.partTimerId)} — RM ${parseFloat(p.totalPay).toFixed(2)}`,
        time: new Date(p.updatedAt),
      });
    }
  });

  events.forEach(e => {
    if (e.createdAt) {
      activities.push({
        id: `ev-${e.id}`,
        type: 'event',
        title: 'New event created',
        description: e.name,
        time: new Date(e.createdAt),
      });
    }
  });

  const sorted = activities
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 5);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((activity, index) => {
            const Icon = iconMap[activity.type];
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colorMap[activity.type])}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(activity.time, { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
