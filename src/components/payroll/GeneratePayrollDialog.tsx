import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePartTimers, useEvents, useCreatePayroll, useAttendance } from '@/hooks/useDatabase';
import { getEventDailyAssignments, getEventStaffSalaries } from '@/db/queries';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import type { EventPayBreakdown } from '@/types';

const payrollSchema = z.object({
  partTimerId: z.string().min(1, 'Please select a part-timer'),
  dateRangeStart: z.string().min(1, 'Start date is required'),
  dateRangeEnd: z.string().min(1, 'End date is required'),
  allowance: z.string().optional(),
}).refine((data) => data.dateRangeEnd >= data.dateRangeStart, {
  message: 'End date cannot be before start date',
  path: ['dateRangeEnd'],
});

type PayrollFormData = z.infer<typeof payrollSchema>;

interface GeneratePayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GeneratePayrollDialog({ open, onOpenChange }: GeneratePayrollDialogProps) {
  const { data: partTimers } = usePartTimers();
  const { data: events } = useEvents();
  const { data: attendance } = useAttendance();
  const createMutation = useCreatePayroll();
  const [eventBreakdown, setEventBreakdown] = useState<EventPayBreakdown[]>([]);
  const [totalPay, setTotalPay] = useState(0);
  const [totalIncentives, setTotalIncentives] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PayrollFormData>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      allowance: '0',
    },
  });

  const selectedPartTimerId = watch('partTimerId');
  const dateRangeStart = watch('dateRangeStart');
  const dateRangeEnd = watch('dateRangeEnd');
  const allowance = watch('allowance') || '0';

  // Calculate event breakdown when part-timer or date range changes
  useEffect(() => {
    if (!selectedPartTimerId || !dateRangeStart || !dateRangeEnd || !events) {
      setEventBreakdown([]);
      setTotalPay(0);
      return;
    }

    const calculateBreakdown = async () => {
      const breakdown: EventPayBreakdown[] = [];
      let basePay = 0;

      for (const event of events) {
        // Check if event is within the selected date range
        const eventStart = parseISO(event.startDate);
        const eventEnd = parseISO(event.endDate);
        const rangeStart = parseISO(dateRangeStart);
        const rangeEnd = parseISO(dateRangeEnd);

        // Check if there's any overlap between event dates and payroll date range
        const hasOverlap =
          (eventStart <= rangeEnd && eventEnd >= rangeStart);

        if (!hasOverlap) continue;

        // Get daily assignments for this event
        const dailyAssignments = await getEventDailyAssignments(event.id);

        // Count how many days the selected part-timer was assigned
        let daysWorked = 0;
        for (const assignment of dailyAssignments) {
          if (assignment.assignedPartTimers.includes(selectedPartTimerId)) {
            const assignmentDate = parseISO(assignment.date);
            // Only count if within payroll date range
            if (assignmentDate >= rangeStart && assignmentDate <= rangeEnd) {
              daysWorked++;
            }
          }
        }

        if (daysWorked === 0) continue;

        // Get the hourly rate for this part-timer for this event
        const staffSalaries = await getEventStaffSalaries(event.id);
        const staffSalary = staffSalaries.find(s => s.partTimerId === selectedPartTimerId);

        if (staffSalary) {
          const hourlyRate = parseFloat(staffSalary.salary);

          // Sum hours from attendance records in the date range for this event
          const eventAttendances = (attendance ?? []).filter(a =>
            a.partTimerId === selectedPartTimerId &&
            a.eventId === event.id &&
            a.date >= dateRangeStart &&
            a.date <= dateRangeEnd &&
            a.hoursWorked
          );
          const totalHoursForEvent = eventAttendances.reduce(
            (sum, a) => sum + parseFloat(String(a.hoursWorked || 0)),
            0
          );
          const salary = totalHoursForEvent * hourlyRate;

          breakdown.push({
            eventId: event.id,
            eventName: event.name,
            hourlyRate,
            hoursWorked: totalHoursForEvent,
            salary,
            daysWorked,
          });
          basePay += salary;
        }
      }

      setEventBreakdown(breakdown);

      // Calculate total incentives from attendance records in date range
      const incentives = (attendance ?? [])
        .filter(att =>
          att.partTimerId === selectedPartTimerId &&
          att.date >= dateRangeStart &&
          att.date <= dateRangeEnd &&
          att.incentive
        )
        .reduce((sum, att) => sum + parseFloat(att.incentive || '0'), 0);

      setTotalIncentives(incentives);

      const totalAllowance = parseFloat(allowance);
      setTotalPay(basePay + totalAllowance + incentives);
    };

    calculateBreakdown();
  }, [selectedPartTimerId, dateRangeStart, dateRangeEnd, events, attendance, allowance]);

  const onSubmit = async (data: PayrollFormData) => {
    try {
      if (eventBreakdown.length === 0) {
        toast.error('No events found for this part-timer in the selected date range');
        return;
      }

      await createMutation.mutateAsync({
        id: crypto.randomUUID(),
        partTimerId: data.partTimerId,
        dateRangeStart: data.dateRangeStart,
        dateRangeEnd: data.dateRangeEnd,
        eventBreakdown: JSON.stringify(eventBreakdown),
        totalHours: '0', // Not used for event-based payroll
        rate: '0', // Not used for event-based payroll
        allowance: data.allowance || '0',
        incentive: totalIncentives.toString(),
        totalPay: totalPay.toString(),
      });

      toast.success('Payroll generated successfully');
      reset();
      setEventBreakdown([]);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to generate payroll');
      console.error(error);
    }
  };

  const activePartTimers = (partTimers ?? []).filter(pt => pt.status === 'active');
  const isLoading = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Payroll</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partTimerId">Part-Timer *</Label>
            <Select
              value={watch('partTimerId')}
              onValueChange={(value) => setValue('partTimerId', value)}
            >
              <SelectTrigger>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateRangeStart">Start Date *</Label>
              <Input id="dateRangeStart" type="date" {...register('dateRangeStart')} />
              {errors.dateRangeStart && <p className="text-sm text-destructive">{errors.dateRangeStart.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateRangeEnd">End Date *</Label>
              <Input id="dateRangeEnd" type="date" {...register('dateRangeEnd')} />
              {errors.dateRangeEnd && <p className="text-sm text-destructive">{errors.dateRangeEnd.message}</p>}
            </div>
          </div>

          {/* Event Breakdown Preview */}
          {eventBreakdown.length > 0 && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm">Event Breakdown</h4>
              {eventBreakdown.map((item) => (
                <div key={item.eventId} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{item.eventName}</span>
                    <span className="text-muted-foreground ml-2">
                      {item.hoursWorked.toFixed(2)}h × RM {item.hourlyRate.toFixed(2)}/hr
                    </span>
                  </div>
                  <span className="font-medium">RM {item.salary.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Base Pay</span>
                  <span>RM {eventBreakdown.reduce((sum, item) => sum + item.salary, 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allowance">Allowance (RM)</Label>
              <p className="text-xs text-muted-foreground">Transport, meal, or other allowances</p>
              <Input
                id="allowance"
                type="number"
                step="0.01"
                min="0"
                {...register('allowance')}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Incentive (RM)</Label>
              <p className="text-xs text-muted-foreground">Auto-calculated from attendance records</p>
              <div className="flex items-center h-10 px-3 py-2 border border-input bg-muted rounded-md">
                <span className="font-medium">RM {totalIncentives.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Total Pay */}
          <div className="bg-primary/5 p-4 rounded-lg border-2 border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Pay</span>
              <span className="text-2xl font-bold text-primary">RM {totalPay.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || eventBreakdown.length === 0}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Payroll
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
