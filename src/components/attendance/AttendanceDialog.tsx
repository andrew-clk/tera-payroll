import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateAttendance, useUpdateAttendance, usePartTimers, useEvents } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Attendance } from '@/types';
import { format } from 'date-fns';

const attendanceSchema = z.object({
  partTimerId: z.string().min(1, 'Part-timer is required'),
  eventId: z.string().min(1, 'Event is required'),
  clockIn: z.string().min(1, 'Clock-in time is required'),
  clockOut: z.string().optional(),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance?: Attendance | null;
  mode?: 'clock-in' | 'clock-out';
}

export function AttendanceDialog({ open, onOpenChange, attendance, mode = 'clock-in' }: AttendanceDialogProps) {
  const isEdit = !!attendance;
  const isClockOut = mode === 'clock-out' || isEdit;

  const createMutation = useCreateAttendance();
  const updateMutation = useUpdateAttendance();
  const { data: partTimers } = usePartTimers();
  const { data: events } = useEvents();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: attendance
      ? {
          partTimerId: attendance.partTimerId,
          eventId: attendance.eventId,
          clockIn: attendance.clockIn,
          clockOut: attendance.clockOut || '',
        }
      : {
          clockIn: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          clockOut: '',
        },
  });

  const partTimerId = watch('partTimerId');
  const eventId = watch('eventId');
  const clockIn = watch('clockIn');
  const clockOut = watch('clockOut');

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    return Math.max(0, diff / (1000 * 60 * 60)); // Convert to hours
  };

  const hoursWorked = clockIn && clockOut ? calculateHours(clockIn, clockOut) : 0;

  const onSubmit = async (data: AttendanceFormData) => {
    try {
      const hours = data.clockOut ? calculateHours(data.clockIn, data.clockOut) : null;

      if (isEdit && attendance) {
        // Clock-out existing attendance
        await updateMutation.mutateAsync({
          id: attendance.id,
          data: {
            clockOut: data.clockOut,
            hoursWorked: hours?.toString(),
            status: data.clockOut ? 'completed' : 'clocked-in',
          },
        });
        toast.success('Clocked out successfully');
      } else {
        // Create new clock-in
        await createMutation.mutateAsync({
          id: crypto.randomUUID(),
          partTimerId: data.partTimerId,
          eventId: data.eventId,
          clockIn: data.clockIn,
          clockOut: data.clockOut || null,
          hoursWorked: hours?.toString() || null,
          photoUrl: null,
          status: 'clocked-in',
        });
        toast.success('Clocked in successfully');
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(isEdit ? 'Failed to clock out' : 'Failed to clock in');
      console.error(error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const activePartTimers = (partTimers ?? []).filter(pt => pt.status === 'active');
  const upcomingEvents = (events ?? []).filter(e => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Clock Out' : 'Clock In'} Attendance
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="partTimerId">Part-Timer *</Label>
                <Select value={partTimerId} onValueChange={(value) => setValue('partTimerId', value)}>
                  <SelectTrigger id="partTimerId">
                    <SelectValue placeholder="Select part-timer" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePartTimers.map((pt) => (
                      <SelectItem key={pt.id} value={pt.id}>
                        {pt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.partTimerId && <p className="text-sm text-destructive">{errors.partTimerId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventId">Event *</Label>
                <Select value={eventId} onValueChange={(value) => setValue('eventId', value)}>
                  <SelectTrigger id="eventId">
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {upcomingEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} - {format(new Date(event.date), 'MMM d, yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.eventId && <p className="text-sm text-destructive">{errors.eventId.message}</p>}
              </div>
            </>
          )}

          {isEdit && attendance && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Part-Timer</span>
                <span className="text-sm font-medium">
                  {partTimers?.find(p => p.id === attendance.partTimerId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Event</span>
                <span className="text-sm font-medium">
                  {events?.find(e => e.id === attendance.eventId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Clock In</span>
                <span className="text-sm font-medium">
                  {format(new Date(attendance.clockIn), 'MMM d, h:mm a')}
                </span>
              </div>
            </div>
          )}

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="clockIn">Clock In Time *</Label>
              <input
                id="clockIn"
                type="datetime-local"
                value={clockIn}
                onChange={(e) => setValue('clockIn', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.clockIn && <p className="text-sm text-destructive">{errors.clockIn.message}</p>}
            </div>
          )}

          {(isEdit || isClockOut) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="clockOut">Clock Out Time</Label>
                <input
                  id="clockOut"
                  type="datetime-local"
                  value={clockOut}
                  onChange={(e) => setValue('clockOut', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {hoursWorked > 0 && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold text-primary">{hoursWorked.toFixed(2)} hrs</p>
                </div>
              )}
            </>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Clock Out' : 'Clock In'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
