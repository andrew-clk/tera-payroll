import { Calendar, MapPin, Users } from 'lucide-react';
import { useEvents, useEventDailyAssignments } from '@/hooks/useDatabase';
import { format, parseISO } from 'date-fns';

export function UpcomingEvents() {
  const { data: events = [] } = useEvents();
  const { data: allAssignments = [] } = useEventDailyAssignments();

  const today = format(new Date(), 'yyyy-MM-dd');

  const upcomingEvents = events
    .filter(e => e.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 4);

  const getStaffCount = (eventId: string) => {
    const eventAssignments = allAssignments.filter((a: any) => a.eventId === eventId);
    const uniqueIds = new Set<string>();
    eventAssignments.forEach((a: any) => {
      (a.assignedPartTimers as string[]).forEach(id => uniqueIds.add(id));
    });
    return uniqueIds.size;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Events</h3>
      <div className="space-y-4">
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No upcoming events</p>
        ) : (
          upcomingEvents.map((event, index) => {
            const staffCount = getStaffCount(event.id);
            const isMultiDay = event.startDate !== event.endDate;
            return (
              <div
                key={event.id}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground text-sm">{event.name}</h4>
                  <span className="badge-status badge-active">{staffCount} staff</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {isMultiDay
                        ? `${format(parseISO(event.startDate), 'MMM d')} – ${format(parseISO(event.endDate), 'MMM d, yyyy')}`
                        : format(parseISO(event.startDate), 'EEE, MMM d, yyyy')}
                      {' '}• {event.startTime} – {event.endTime}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
