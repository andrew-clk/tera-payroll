import { Clock, UserCheck, Calendar, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'clock-in' | 'clock-out' | 'event' | 'payroll';
  title: string;
  description: string;
  time: string;
}

const activities: ActivityItem[] = [
  {
    id: '1',
    type: 'clock-in',
    title: 'Muhammad Hafiz clocked in',
    description: 'Wellness Workshop - Nutrition Basics',
    time: '2 mins ago',
  },
  {
    id: '2',
    type: 'payroll',
    title: 'Payroll confirmed',
    description: 'January 2024 payroll for 2 staff',
    time: '1 hour ago',
  },
  {
    id: '3',
    type: 'event',
    title: 'New event created',
    description: 'Diet Consultation Drive - Feb 15',
    time: '3 hours ago',
  },
  {
    id: '4',
    type: 'clock-out',
    title: 'Siti Aminah clocked out',
    description: 'Wellness Workshop - Nutrition Basics',
    time: '5 hours ago',
  },
];

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
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <div 
              key={activity.id} 
              className="flex items-start gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", colorMap[activity.type])}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
