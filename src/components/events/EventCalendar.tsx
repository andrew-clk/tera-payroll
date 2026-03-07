import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Users, MapPin, Clock, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEvents, usePartTimers } from '@/hooks/useDatabase';
import { getEventDailyAssignments } from '@/db/queries';
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
  parseISO,
  isWithinInterval,
  eachDayOfInterval,
  differenceInDays
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EventDialog } from './EventDialog';
import type { Event, EventDailyAssignment } from '@/types';

export function EventCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventAssignments, setEventAssignments] = useState<Record<string, EventDailyAssignment[]>>({});

  const { data: events, isLoading } = useEvents();
  const { data: partTimers } = usePartTimers();

  // Load daily assignments for selected event
  useEffect(() => {
    if (events) {
      Promise.all(
        events.map(async (event) => {
          const assignments = await getEventDailyAssignments(event.id);
          return { eventId: event.id, assignments };
        })
      ).then((results) => {
        const assignmentMap: Record<string, EventDailyAssignment[]> = {};
        results.forEach(({ eventId, assignments }) => {
          assignmentMap[eventId] = assignments;
        });
        setEventAssignments(assignmentMap);
      });
    }
  }, [events]);

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
    const dateStr = format(date, 'yyyy-MM-dd');
    return (events ?? []).filter(event => {
      // Compare as date strings to avoid timezone issues
      return dateStr >= event.startDate && dateStr <= event.endDate;
    });
  };

  const getStaffCountForEventDay = (eventId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const assignments = eventAssignments[eventId] || [];
    const dayAssignment = assignments.find(a => a.date === dateStr);
    return dayAssignment?.assignedPartTimers.length || 0;
  };

  const getStaffNamesForEventDay = (eventId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const assignments = eventAssignments[eventId] || [];
    const dayAssignment = assignments.find(a => a.date === dateStr);
    const assignedIds = dayAssignment?.assignedPartTimers || [];
    return assignedIds
      .map(id => (partTimers ?? []).find(p => p.id === id)?.name)
      .filter(Boolean) as string[];
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
                    "min-h-[140px] p-2 border-b border-r border-border transition-colors",
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
                  <div className="space-y-1.5">
                    {dayEvents.slice(0, 3).map(event => {
                      const staffCount = getStaffCountForEventDay(event.id, date);
                      const staffNames = getStaffNamesForEventDay(event.id, date);
                      const eventStart = new Date(event.startDate);
                      const eventEnd = new Date(event.endDate);
                      const isMultiDay = differenceInDays(eventEnd, eventStart) > 0;
                      const isFirstDay = isSameDay(date, eventStart);
                      const hasNoStaff = staffCount === 0;

                      return (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={cn(
                            "cursor-pointer rounded-md p-1.5 px-2 transition-colors shadow-sm",
                            hasNoStaff
                              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              : "bg-primary text-primary-foreground hover:bg-primary/90",
                            isMultiDay && "font-semibold"
                          )}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className={cn(
                              "truncate leading-tight",
                              isMultiDay ? "text-sm font-semibold" : "text-xs font-medium"
                            )}>
                              {event.name}
                              {isMultiDay && !isFirstDay && " (cont.)"}
                            </span>
                            <div className="flex items-center gap-1 text-xs opacity-90">
                              {hasNoStaff ? (
                                <span className="font-medium">⚠️ 0 staff - Add staff!</span>
                              ) : (
                                <>
                                  <Users className="w-3 h-3 inline flex-shrink-0" />
                                  <span className="truncate">
                                    {staffNames.slice(0, 2).join(", ")}
                                    {staffNames.length > 2 && ` +${staffNames.length - 2}`}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1.5">
                        +{dayEvents.length - 3} more
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Date Range</span>
                  </div>
                  <p className="font-medium">
                    {format(new Date(selectedEvent.startDate), 'MMM d')} - {format(new Date(selectedEvent.endDate), 'MMM d, yyyy')}
                    {' '}({differenceInDays(new Date(selectedEvent.endDate), new Date(selectedEvent.startDate)) + 1} days)
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Time</span>
                  </div>
                  <p className="font-medium">{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                </div>
                {selectedEvent.location && (
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>Location</span>
                    </div>
                    <p className="font-medium">{selectedEvent.location}</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Daily Staff Assignments</span>
                </div>
                <div className="space-y-3">
                  {eachDayOfInterval({
                    start: new Date(selectedEvent.startDate),
                    end: new Date(selectedEvent.endDate)
                  }).map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const assignments = eventAssignments[selectedEvent.id] || [];
                    const dayAssignment = assignments.find(a => a.date === dateStr);
                    const assignedIds = dayAssignment?.assignedPartTimers || [];
                    const assignedNames = assignedIds
                      .map(id => (partTimers ?? []).find(p => p.id === id)?.name)
                      .filter(Boolean);

                    return (
                      <div key={dateStr} className="border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{format(day, 'EEEE, MMM d, yyyy')}</p>
                          <span className="text-xs text-muted-foreground">
                            {assignedNames.length} staff
                          </span>
                        </div>
                        {assignedNames.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {assignedNames.map((name, i) => (
                              <span key={i} className="badge-status badge-active text-xs">
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No staff assigned</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingEvent(selectedEvent);
                setSelectedEvent(null);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <EventDialog
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
        event={editingEvent}
      />
    </>
  );
}
