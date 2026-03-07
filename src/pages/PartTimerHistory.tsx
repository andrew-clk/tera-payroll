import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { useEvents } from '@/hooks/useDatabase';
import { getEventDailyAssignments, getAttendanceByPartTimerAndEvent, getEventStaffSalaries } from '@/db/queries';
import { format, parseISO, isPast } from 'date-fns';
import { PartTimerLayout } from '@/components/part-timer/PartTimerLayout';
import type { Attendance } from '@/types';

interface EventHistory {
  eventId: string;
  eventName: string;
  totalDays: number;
  workedDays: number;
  completedDays: number;
  salary: number;
  dates: string[];
}

export default function PartTimerHistory() {
  const navigate = useNavigate();
  const [partTimerId, setPartTimerId] = useState<string>('');
  const [partTimerName, setPartTimerName] = useState<string>('');
  const [eventHistories, setEventHistories] = useState<EventHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: events } = useEvents();

  useEffect(() => {
    // Check if logged in
    const ptId = localStorage.getItem('partTimerId');
    const ptName = localStorage.getItem('partTimerName');

    if (!ptId || !ptName) {
      navigate('/part-timer/login');
      return;
    }

    setPartTimerId(ptId);
    setPartTimerName(ptName);
  }, [navigate]);

  useEffect(() => {
    if (!partTimerId || !events) return;

    const loadHistory = async () => {
      setIsLoading(true);
      const histories: EventHistory[] = [];

      for (const event of events) {
        const dailyAssignments = await getEventDailyAssignments(event.id);
        const assignedDates = dailyAssignments
          .filter(a => a.assignedPartTimers.includes(partTimerId))
          .map(a => a.date);

        if (assignedDates.length === 0) continue;

        // Only include events with at least one past date
        const pastDates = assignedDates.filter(d => isPast(parseISO(d)));
        if (pastDates.length === 0) continue;

        // Get attendance records
        const attendanceRecords = await getAttendanceByPartTimerAndEvent(partTimerId, event.id);
        const completedDays = attendanceRecords.filter(a => a.status === 'completed').length;

        // Get salary for this event
        const staffSalaries = await getEventStaffSalaries(event.id);
        const staffSalary = staffSalaries.find(s => s.partTimerId === partTimerId);
        const salary = staffSalary ? parseFloat(staffSalary.salary) : 0;

        histories.push({
          eventId: event.id,
          eventName: event.name,
          totalDays: assignedDates.length,
          workedDays: attendanceRecords.length,
          completedDays,
          salary,
          dates: assignedDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
        });
      }

      // Sort by most recent first
      histories.sort((a, b) => {
        const lastDateA = a.dates[a.dates.length - 1];
        const lastDateB = b.dates[b.dates.length - 1];
        return new Date(lastDateB).getTime() - new Date(lastDateA).getTime();
      });

      setEventHistories(histories);
      setIsLoading(false);
    };

    loadHistory();
  }, [partTimerId, events]);

  const totalEarnings = eventHistories.reduce((sum, h) => sum + h.salary, 0);
  const totalDaysWorked = eventHistories.reduce((sum, h) => sum + h.completedDays, 0);

  if (isLoading) {
    return (
      <PartTimerLayout partTimerName={partTimerName}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading job history...</p>
          </div>
        </div>
      </PartTimerLayout>
    );
  }

  return (
    <PartTimerLayout partTimerName={partTimerName}>
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDaysWorked}</p>
                  <p className="text-sm text-muted-foreground">Days Worked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{eventHistories.length}</p>
                  <p className="text-sm text-muted-foreground">Events Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">RM {totalEarnings.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event History */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Event History</h2>
          {eventHistories.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No job history yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {eventHistories.map((history) => (
                <Card key={history.eventId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{history.eventName}</CardTitle>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(parseISO(history.dates[0]), 'MMM d')} - {format(parseISO(history.dates[history.dates.length - 1]), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span>
                              Assigned: <span className="font-medium text-foreground">{history.totalDays} days</span>
                            </span>
                            <span>•</span>
                            <span>
                              Worked: <span className="font-medium text-foreground">{history.completedDays} days</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          RM {history.salary.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Total Payment
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Attendance Rate</span>
                        <span className="font-medium">
                          {((history.completedDays / history.totalDays) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${(history.completedDays / history.totalDays) * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PartTimerLayout>
  );
}
