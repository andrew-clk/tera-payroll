import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateEvent, useUpdateEvent, usePartTimers } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Event } from '@/types';
import { format } from 'date-fns';

const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().optional(),
  assignedPartTimers: z.array(z.string()),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  selectedDate?: Date;
}

export function EventDialog({ open, onOpenChange, event, selectedDate }: EventDialogProps) {
  const isEdit = !!event;
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const { data: partTimers } = usePartTimers();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event
      ? {
          name: event.name,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location || '',
          assignedPartTimers: event.assignedPartTimers || [],
        }
      : {
          date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          startTime: '09:00',
          endTime: '17:00',
          assignedPartTimers: [],
        },
  });

  const assignedPartTimers = watch('assignedPartTimers');

  const togglePartTimer = (partTimerId: string) => {
    const current = assignedPartTimers || [];
    if (current.includes(partTimerId)) {
      setValue('assignedPartTimers', current.filter(id => id !== partTimerId));
    } else {
      setValue('assignedPartTimers', [...current, partTimerId]);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      if (isEdit && event) {
        await updateMutation.mutateAsync({
          id: event.id,
          data,
        });
        toast.success('Event updated successfully');
      } else {
        await createMutation.mutateAsync({
          id: crypto.randomUUID(),
          ...data,
          assignedPartTimers: data.assignedPartTimers || [],
        });
        toast.success('Event created successfully');
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(isEdit ? 'Failed to update event' : 'Failed to create event');
      console.error(error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const activePartTimers = (partTimers ?? []).filter(pt => pt.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Event' : 'Create New Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input id="name" {...register('name')} placeholder="Weekend Promotion Event" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input id="startTime" type="time" {...register('startTime')} />
              {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input id="endTime" type="time" {...register('endTime')} />
              {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register('location')} placeholder="Main Store, KLCC" />
          </div>

          <div className="space-y-3">
            <Label>Assign Part-Timers ({assignedPartTimers?.length || 0} selected)</Label>
            <div className="border border-border rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-2">
              {activePartTimers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active part-timers available</p>
              ) : (
                activePartTimers.map((partTimer) => (
                  <div key={partTimer.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={`pt-${partTimer.id}`}
                      checked={assignedPartTimers?.includes(partTimer.id)}
                      onCheckedChange={() => togglePartTimer(partTimer.id)}
                    />
                    <label
                      htmlFor={`pt-${partTimer.id}`}
                      className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <div className="flex items-center justify-between">
                        <span>{partTimer.name}</span>
                        <span className="text-xs text-muted-foreground">RM {partTimer.defaultRate}/hr</span>
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Update' : 'Create'} Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
