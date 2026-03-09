import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateEvent, useUpdateEvent, usePartTimers } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { Loader2, CalendarDays } from 'lucide-react';
import type { Event } from '@/types';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { createEventDailyAssignment, getEventDailyAssignments, deleteEventDailyAssignments, getEventStaffSalaries, createEventStaffSalary, deleteEventStaffSalaries } from '@/db/queries';
import { useState, useEffect } from 'react';

// Generate time slots in 30-minute intervals
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeStr);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().optional(),
  rentalCost: z.string().min(1, 'Rental cost is required'),
}).refine((data) => {
  // Validate that end date is not before start date
  return data.endDate >= data.startDate;
}, {
  message: 'End date cannot be before start date',
  path: ['endDate'],
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
  const [dailyAssignments, setDailyAssignments] = useState<Record<string, string[]>>({});
  const [staffSalaries, setStaffSalaries] = useState<Record<string, string>>({});
  const [eventDays, setEventDays] = useState<Date[]>([]);

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
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location || '',
        }
      : {
          startDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          endDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          startTime: '09:00',
          endTime: '17:00',
        },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Reset form and load existing data when event changes
  useEffect(() => {
    if (open) {
      if (isEdit && event) {
        // Reset form with event data
        reset({
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location || '',
          rentalCost: event.rentalCost?.toString() || '0',
        });

        // Load existing daily assignments
        getEventDailyAssignments(event.id).then((assignments) => {
          const assignmentMap: Record<string, string[]> = {};
          assignments.forEach((assignment) => {
            assignmentMap[assignment.date] = assignment.assignedPartTimers;
          });
          setDailyAssignments(assignmentMap);
        });

        // Load existing staff salaries - NOTE: Old data only had per-event salary, not per-day
        // For backward compatibility, we'll populate all days with the same salary
        getEventStaffSalaries(event.id).then((salaries) => {
          const salaryMap: Record<string, string> = {};
          salaries.forEach((salary) => {
            // Populate salary for all days in the event
            eventDays.forEach((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              salaryMap[`${salary.partTimerId}-${dateStr}`] = salary.salary;
            });
          });
          setStaffSalaries(salaryMap);
        });
      } else {
        // Reset to default values for new event
        reset({
          name: '',
          startDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          endDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          startTime: '09:00',
          endTime: '17:00',
          location: '',
          rentalCost: '0',
        });
        setDailyAssignments({});
        setStaffSalaries({});
      }
    }
  }, [event, isEdit, open, reset, selectedDate]);

  // Update event days when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      try {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        if (start <= end) {
          const days = eachDayOfInterval({ start, end });
          setEventDays(days);
        }
      } catch (e) {
        setEventDays([]);
      }
    }
  }, [startDate, endDate]);

  const togglePartTimerForDay = (date: string, partTimerId: string) => {
    setDailyAssignments((prev) => {
      const current = prev[date] || [];
      if (current.includes(partTimerId)) {
        return { ...prev, [date]: current.filter((id) => id !== partTimerId) };
      } else {
        return { ...prev, [date]: [...current, partTimerId] };
      }
    });
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      let eventId: string;

      if (isEdit && event) {
        await updateMutation.mutateAsync({
          id: event.id,
          data,
        });
        eventId = event.id;

        // Delete existing daily assignments and staff salaries
        await deleteEventDailyAssignments(eventId);
        await deleteEventStaffSalaries(eventId);
      } else {
        eventId = crypto.randomUUID();
        await createMutation.mutateAsync({
          id: eventId,
          ...data,
          rentalCost: data.rentalCost,
        });
      }

      // Create daily assignments for each day
      for (const day of eventDays) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const assignedPTs = dailyAssignments[dateStr] || [];

        await createEventDailyAssignment({
          id: crypto.randomUUID(),
          eventId,
          date: dateStr,
          assignedPartTimers: assignedPTs,
        });
      }

      // Create staff salaries - now using composite keys (partTimerId-dateStr)
      // We need to aggregate salaries per part-timer across all days
      const partTimerSalaryMap: Record<string, number[]> = {};

      for (const [compositeKey, salary] of Object.entries(staffSalaries)) {
        if (salary && parseFloat(salary) > 0) {
          const [partTimerId] = compositeKey.split('-');
          if (!partTimerSalaryMap[partTimerId]) {
            partTimerSalaryMap[partTimerId] = [];
          }
          partTimerSalaryMap[partTimerId].push(parseFloat(salary));
        }
      }

      // Save average salary per part-timer for backward compatibility with existing schema
      for (const [partTimerId, salaries] of Object.entries(partTimerSalaryMap)) {
        const avgSalary = salaries.reduce((sum, s) => sum + s, 0) / salaries.length;
        await createEventStaffSalary({
          id: crypto.randomUUID(),
          eventId,
          partTimerId,
          salary: avgSalary.toFixed(2),
        });
      }

      toast.success(isEdit ? 'Event updated successfully' : 'Event created successfully');
      reset();
      setDailyAssignments({});
      setStaffSalaries({});
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Select
                value={watch('startTime')}
                onValueChange={(value) => setValue('startTime', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Select
                value={watch('endTime')}
                onValueChange={(value) => setValue('endTime', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register('location')} placeholder="Main Store, KLCC" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rentalCost">Rental Cost (RM) *</Label>
            <Input
              id="rentalCost"
              type="number"
              step="0.01"
              min="0"
              {...register('rentalCost')}
              placeholder="0.00"
            />
            {errors.rentalCost && <p className="text-sm text-destructive">{errors.rentalCost.message}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <Label>Daily Staff Assignments</Label>
            </div>
            {eventDays.length === 0 ? (
              <p className="text-sm text-muted-foreground">Select date range to assign staff for each day</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {eventDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const assignedCount = dailyAssignments[dateStr]?.length || 0;

                  return (
                    <div key={dateStr} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{format(day, 'EEEE, MMM d, yyyy')}</h4>
                        <span className="text-xs text-muted-foreground">
                          {assignedCount} {assignedCount === 1 ? 'staff' : 'staff'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {activePartTimers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No active part-timers available</p>
                        ) : (
                          activePartTimers.map((partTimer) => (
                            <div key={partTimer.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50">
                              <Checkbox
                                id={`pt-${dateStr}-${partTimer.id}`}
                                checked={dailyAssignments[dateStr]?.includes(partTimer.id) || false}
                                onCheckedChange={() => togglePartTimerForDay(dateStr, partTimer.id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 space-y-2">
                                <label
                                  htmlFor={`pt-${dateStr}-${partTimer.id}`}
                                  className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block"
                                >
                                  <span>{partTimer.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">(Default: RM {partTimer.defaultRate}/hr)</span>
                                </label>
                                {dailyAssignments[dateStr]?.includes(partTimer.id) && (
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor={`salary-${partTimer.id}-${dateStr}`} className="text-xs whitespace-nowrap">
                                      Event Salary (RM):
                                    </Label>
                                    <Input
                                      id={`salary-${partTimer.id}-${dateStr}`}
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      value={staffSalaries[`${partTimer.id}-${dateStr}`] || ''}
                                      onChange={(e) => setStaffSalaries(prev => ({
                                        ...prev,
                                        [`${partTimer.id}-${dateStr}`]: e.target.value
                                      }))}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
