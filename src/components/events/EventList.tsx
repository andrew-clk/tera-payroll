import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, MoreVertical, Plus, Loader2 } from 'lucide-react';
import { useEvents, usePartTimers, useDeleteEvent } from '@/hooks/useDatabase';
import { format, parseISO, differenceInDays } from 'date-fns';
import { getEventDailyAssignments } from '@/db/queries';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EventDialog } from './EventDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Event } from '@/types';

export function EventList() {
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [eventStaffCounts, setEventStaffCounts] = useState<Record<string, number>>({});
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: partTimers } = usePartTimers();
  const deleteMutation = useDeleteEvent();

  // Load staff counts for each event
  useEffect(() => {
    if (events) {
      Promise.all(
        events.map(async (event) => {
          const assignments = await getEventDailyAssignments(event.id);
          const uniqueStaff = new Set<string>();
          assignments.forEach((assignment) => {
            assignment.assignedPartTimers.forEach((ptId) => uniqueStaff.add(ptId));
          });
          return { eventId: event.id, count: uniqueStaff.size };
        })
      ).then((results) => {
        const counts: Record<string, number> = {};
        results.forEach(({ eventId, count }) => {
          counts[eventId] = count;
        });
        setEventStaffCounts(counts);
      });
    }
  }, [events]);

  const getAssignedNames = (eventId: string) => {
    // This will be loaded from daily assignments
    return [];
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Event deleted successfully');
      setDeletingEvent(null);
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const isPastEvent = (endDate: string) => {
    return new Date(endDate) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  const getDateRangeText = (startDate: string, endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
    if (days === 1) {
      return format(new Date(startDate), 'MMM d, yyyy');
    }
    return `${format(new Date(startDate), 'MMM d')} - ${format(new Date(endDate), 'MMM d, yyyy')} (${days} days)`;
  };

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{(events ?? []).length} events total</p>
      </div>

      <div className="space-y-3">
        {(events ?? []).map((event, index) => {
          const isPast = isPastEvent(event.endDate);
          const staffCount = eventStaffCounts[event.id] || 0;
          const days = differenceInDays(new Date(event.endDate), new Date(event.startDate)) + 1;

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
                      {format(new Date(event.startDate), 'MMM')}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {format(new Date(event.startDate), 'd')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{event.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{getDateRangeText(event.startDate, event.endDate)}</span>
                      </div>
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
                      <span className="badge-status badge-active text-xs">
                        {staffCount} staff across {days} {days === 1 ? 'day' : 'days'}
                      </span>
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
                    <DropdownMenuItem onClick={() => setEditingEvent(event)}>Edit Event</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingEvent(event)}>Manage Staff</DropdownMenuItem>
                    <DropdownMenuItem>View Attendance</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeletingEvent(event)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Event Dialog */}
      <EventDialog
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
        event={editingEvent}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingEvent?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEvent && handleDelete(deletingEvent.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
