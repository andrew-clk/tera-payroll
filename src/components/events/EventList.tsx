import { useState } from 'react';
import { Calendar, MapPin, Users, Clock, MoreVertical, Plus, Loader2 } from 'lucide-react';
import { useEvents, usePartTimers, useDeleteEvent } from '@/hooks/useDatabase';
import { format, parseISO } from 'date-fns';
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
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: partTimers } = usePartTimers();
  const deleteMutation = useDeleteEvent();

  const getAssignedNames = (ids: string[]) => {
    return ids
      .map(id => (partTimers ?? []).find(p => p.id === id)?.name)
      .filter(Boolean);
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

  const isPastEvent = (date: string) => {
    return new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
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
