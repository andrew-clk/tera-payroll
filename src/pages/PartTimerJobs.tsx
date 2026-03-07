import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, MapPin, Clock, Camera, LogIn, LogOut as LogOutIcon } from 'lucide-react';
import { useEvents } from '@/hooks/useDatabase';
import { getEventDailyAssignments, getAttendanceByPartTimerAndEvent } from '@/db/queries';
import { format, parseISO, isPast, isFuture, isToday } from 'date-fns';
import { ClockInOutDialog } from '@/components/part-timer/ClockInOutDialog';
import { PartTimerLayout } from '@/components/part-timer/PartTimerLayout';
import type { Attendance } from '@/types';

interface JobAssignment {
  eventId: string;
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendance?: Attendance;
}

export default function PartTimerJobs() {
  const navigate = useNavigate();
  const [partTimerId, setPartTimerId] = useState<string>('');
  const [partTimerName, setPartTimerName] = useState<string>('');
  const [jobs, setJobs] = useState<JobAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobAssignment | null>(null);
  const [clockInOutDialogOpen, setClockInOutDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'clockIn' | 'clockOut'>('clockIn');

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

    const loadJobs = async () => {
      setIsLoading(true);
      const assignments: JobAssignment[] = [];

      for (const event of events) {
        const dailyAssignments = await getEventDailyAssignments(event.id);

        for (const assignment of dailyAssignments) {
          if (assignment.assignedPartTimers.includes(partTimerId)) {
            // Check if there's attendance for this date
            const attendanceRecords = await getAttendanceByPartTimerAndEvent(partTimerId, event.id);
            const attendance = attendanceRecords.find(a => a.date === assignment.date);

            assignments.push({
              eventId: event.id,
              eventName: event.name,
              date: assignment.date,
              startTime: event.startTime,
              endTime: event.endTime,
              location: event.location,
              attendance,
            });
          }
        }
      }

      // Sort by date (upcoming first)
      assignments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setJobs(assignments);
      setIsLoading(false);
    };

    loadJobs();
  }, [partTimerId, events]);

  const handleClockIn = (job: JobAssignment) => {
    setSelectedJob(job);
    setActionType('clockIn');
    setClockInOutDialogOpen(true);
  };

  const handleClockOut = (job: JobAssignment) => {
    setSelectedJob(job);
    setActionType('clockOut');
    setClockInOutDialogOpen(true);
  };

  const handleClockInOutSuccess = () => {
    // Reload jobs
    window.location.reload();
  };

  const getJobStatus = (job: JobAssignment) => {
    const jobDate = parseISO(job.date);

    if (job.attendance?.status === 'completed') {
      return { label: 'Completed', color: 'bg-success/10 text-success' };
    }

    if (job.attendance?.status === 'clocked-in') {
      return { label: 'Clocked In', color: 'bg-info/10 text-info' };
    }

    if (isToday(jobDate)) {
      return { label: 'Today', color: 'bg-warning/10 text-warning' };
    }

    if (isFuture(jobDate)) {
      return { label: 'Upcoming', color: 'bg-muted text-muted-foreground' };
    }

    return { label: 'Missed', color: 'bg-destructive/10 text-destructive' };
  };

  const canClockIn = (job: JobAssignment) => {
    return isToday(parseISO(job.date)) && !job.attendance?.clockIn;
  };

  const canClockOut = (job: JobAssignment) => {
    return isToday(parseISO(job.date)) && job.attendance?.clockIn && !job.attendance?.clockOut;
  };

  const upcomingJobs = jobs.filter(j => isFuture(parseISO(j.date)) || isToday(parseISO(j.date)));
  const pastJobs = jobs.filter(j => isPast(parseISO(j.date)) && !isToday(parseISO(j.date)));

  if (isLoading) {
    return (
      <PartTimerLayout partTimerName={partTimerName}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading your jobs...</p>
          </div>
        </div>
      </PartTimerLayout>
    );
  }

  return (
    <PartTimerLayout partTimerName={partTimerName}>
      <div className="space-y-6">
        {/* Upcoming Jobs */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Jobs ({upcomingJobs.length})</h2>
          {upcomingJobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No upcoming jobs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingJobs.map((job) => {
                const status = getJobStatus(job);
                return (
                  <Card key={`${job.eventId}-${job.date}`} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{job.eventName}</CardTitle>
                          <CardDescription className="mt-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{format(parseISO(job.date), 'EEEE, MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{job.startTime} - {job.endTime}</span>
                            </div>
                            {job.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{job.location}</span>
                              </div>
                            )}
                          </CardDescription>
                        </div>
                        <span className={`badge-status ${status.color} whitespace-nowrap`}>
                          {status.label}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {canClockIn(job) && (
                          <Button onClick={() => handleClockIn(job)} className="gap-2 flex-1">
                            <LogIn className="w-4 h-4" />
                            Clock In
                          </Button>
                        )}
                        {canClockOut(job) && (
                          <Button onClick={() => handleClockOut(job)} variant="outline" className="gap-2 flex-1">
                            <LogOutIcon className="w-4 h-4" />
                            Clock Out
                          </Button>
                        )}
                        {job.attendance?.clockIn && job.attendance?.clockOut && (
                          <div className="text-sm text-muted-foreground">
                            Worked: {job.attendance.hoursWorked} hours
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Jobs */}
        {pastJobs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Past Jobs ({pastJobs.length})</h2>
            <div className="space-y-3">
              {pastJobs.slice(0, 5).map((job) => {
                const status = getJobStatus(job);
                return (
                  <Card key={`${job.eventId}-${job.date}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{job.eventName}</CardTitle>
                          <CardDescription className="text-sm">
                            {format(parseISO(job.date), 'MMM d, yyyy')} • {job.startTime} - {job.endTime}
                          </CardDescription>
                        </div>
                        <span className={`badge-status ${status.color} text-xs`}>
                          {status.label}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Clock In/Out Dialog */}
      {selectedJob && (
        <ClockInOutDialog
          open={clockInOutDialogOpen}
          onOpenChange={setClockInOutDialogOpen}
          job={selectedJob}
          partTimerId={partTimerId}
          actionType={actionType}
          onSuccess={handleClockInOutSuccess}
        />
      )}
    </PartTimerLayout>
  );
}
