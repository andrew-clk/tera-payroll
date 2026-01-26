import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockEvents, mockPartTimers } from '@/data/mockData';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO 
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Event } from '@/types';

export function EventCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows: Date[][] = [];
  let days: Date[] = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const getEventsForDay = (date: Date) => {
    return mockEvents.filter(event => 
      isSameDay(parseISO(event.date), date)
    );
  };

  const getAssignedNames = (ids: string[]) => {
    return ids
      .map(id => mockPartTimers.find(p => p.id === id)?.name)
      .filter(Boolean);
  };

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {rows.map((row, rowIndex) => (
            row.map((date, dateIndex) => {
              const dayEvents = getEventsForDay(date);
              const isToday = isSameDay(date, new Date());
              const isCurrentMonth = isSameMonth(date, currentMonth);

              return (
                <div
                  key={`${rowIndex}-${dateIndex}`}
                  className={cn(
                    "min-h-[120px] p-2 border-b border-r border-border transition-colors",
                    !isCurrentMonth && "bg-muted/30",
                    isToday && "bg-primary/5",
                    dateIndex === 6 && "border-r-0"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday && "text-primary",
                    !isCurrentMonth && "text-muted-foreground"
                  )}>
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="calendar-event"
                      >
                        {event.name}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground pl-1.5">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ))}
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(parseISO(selectedEvent.date), 'EEEE, MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                </div>
                {selectedEvent.location && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedEvent.location}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-2">Assigned Part-Timers ({selectedEvent.assignedPartTimers.length})</p>
                <div className="flex flex-wrap gap-2">
                  {getAssignedNames(selectedEvent.assignedPartTimers).map((name, i) => (
                    <span key={i} className="badge-status badge-active">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
