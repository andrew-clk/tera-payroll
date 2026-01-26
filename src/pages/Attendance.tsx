import { useState } from 'react';
import { Search, Clock, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockAttendance, mockPartTimers, mockEvents } from '@/data/mockData';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Attendance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');

  const getPartTimerName = (id: string) => mockPartTimers.find(p => p.id === id)?.name || 'Unknown';
  const getEventName = (id: string) => mockEvents.find(e => e.id === id)?.name || 'Unknown';

  const filteredAttendance = mockAttendance.filter(att => {
    const partTimerName = getPartTimerName(att.partTimerId).toLowerCase();
    const eventName = getEventName(att.eventId).toLowerCase();
    const matchesSearch = partTimerName.includes(searchQuery.toLowerCase()) || 
                          eventName.includes(searchQuery.toLowerCase());
    const matchesEvent = eventFilter === 'all' || att.eventId === eventFilter;
    return matchesSearch && matchesEvent;
  });

  const statusConfig = {
    'clocked-in': { icon: Clock, color: 'text-info bg-info/10', label: 'Clocked In' },
    'completed': { icon: CheckCircle2, color: 'text-success bg-success/10', label: 'Completed' },
    'pending': { icon: AlertCircle, color: 'text-warning bg-warning/10', label: 'Pending' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Track part-timer clock-in and clock-out records</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {mockEvents.map(event => (
              <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold">{mockAttendance.filter(a => a.status === 'clocked-in').length}</p>
            <p className="text-sm text-muted-foreground">Currently Clocked In</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{mockAttendance.filter(a => a.status === 'completed').length}</p>
            <p className="text-sm text-muted-foreground">Completed Today</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{mockAttendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0).toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Total Hours This Period</p>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="space-y-3">
        {filteredAttendance.map((attendance, index) => {
          const StatusIcon = statusConfig[attendance.status].icon;
          return (
            <div 
              key={attendance.id}
              className="bg-card rounded-xl border border-border p-5 animate-slide-up hover:shadow-soft transition-shadow"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                    {getPartTimerName(attendance.partTimerId).split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{getPartTimerName(attendance.partTimerId)}</h3>
                    <p className="text-sm text-muted-foreground">{getEventName(attendance.eventId)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Clock In</p>
                    <p className="font-medium">{format(parseISO(attendance.clockIn), 'h:mm a')}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Clock Out</p>
                    <p className="font-medium">{attendance.clockOut ? format(parseISO(attendance.clockOut), 'h:mm a') : '-'}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Hours</p>
                    <p className="font-medium">{attendance.hoursWorked?.toFixed(2) || '-'}</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                    statusConfig[attendance.status].color
                  )}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig[attendance.status].label}
                  </div>
                  {attendance.photoUrl && (
                    <Button variant="outline" size="sm" className="gap-2">
                      <Camera className="w-4 h-4" />
                      View Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
