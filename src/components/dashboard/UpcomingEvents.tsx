import { Calendar, MapPin, Users } from 'lucide-react';
import { mockEvents, mockPartTimers } from '@/data/mockData';
import { format, parseISO, isAfter } from 'date-fns';

export function UpcomingEvents() {
  const upcomingEvents = mockEvents
    .filter(event => isAfter(parseISO(event.date), new Date()) || event.date === format(new Date(), 'yyyy-MM-dd'))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const getAssignedNames = (ids: string[]) => {
    return ids
      .map(id => mockPartTimers.find(p => p.id === id)?.name.split(' ')[0])
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Events</h3>
      <div className="space-y-4">
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No upcoming events</p>
        ) : (
          upcomingEvents.map((event, index) => (
            <div 
              key={event.id} 
              className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-foreground text-sm">{event.name}</h4>
                <span className="badge-status badge-active">
                  {event.assignedPartTimers.length} staff
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(parseISO(event.date), 'EEE, MMM d')} • {event.startTime} - {event.endTime}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span className="truncate">{getAssignedNames(event.assignedPartTimers)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
