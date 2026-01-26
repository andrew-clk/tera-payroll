import { Calendar, MapPin, Users, Clock, MoreVertical, Plus } from 'lucide-react';
import { mockEvents, mockPartTimers } from '@/data/mockData';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface EventListProps {
  onAddEvent?: () => void;
}

export function EventList({ onAddEvent }: EventListProps) {
  const getAssignedNames = (ids: string[]) => {
    return ids
      .map(id => mockPartTimers.find(p => p.id === id)?.name)
      .filter(Boolean);
  };

  const isPastEvent = (date: string) => {
    return new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{mockEvents.length} events total</p>
        <Button onClick={onAddEvent} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>
      
      <div className="space-y-3">
        {mockEvents.map((event, index) => {
          const isPast = isPastEvent(event.date);
          return (
            <div 
              key={event.id} 
              className={cn(
                "bg-card rounded-xl border border-border p-5 transition-all hover:shadow-soft animate-slide-up",
                isPast && "opacity-60"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs text-primary font-medium">
                      {format(parseISO(event.date), 'MMM')}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {format(parseISO(event.date), 'd')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{event.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{event.startTime} - {event.endTime}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1.5">
                        {getAssignedNames(event.assignedPartTimers).slice(0, 3).map((name, i) => (
                          <span key={i} className="badge-status badge-active text-xs">
                            {name?.split(' ')[0]}
                          </span>
                        ))}
                        {event.assignedPartTimers.length > 3 && (
                          <span className="badge-status bg-muted text-muted-foreground text-xs">
                            +{event.assignedPartTimers.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Event</DropdownMenuItem>
                    <DropdownMenuItem>Manage Staff</DropdownMenuItem>
                    <DropdownMenuItem>View Attendance</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
