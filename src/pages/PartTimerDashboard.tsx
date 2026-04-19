import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut, Calendar, MapPin, Clock, Camera } from 'lucide-react';
import { useEvents } from '@/hooks/useDatabase';
import { getEventDailyAssignments, getAttendanceByPartTimerAndEvent, getEventStaffSalaries, createAttendance, updateAttendance } from '@/db/queries';
import { format, parseISO, isSameDay, isPast, isFuture, isToday } from 'date-fns';
import { toast } from 'sonner';
import { ClockInOutDialog } from '@/components/part-timer/ClockInOutDialog';
import type { Attendance } from '@/types';

interface JobAssignment {
  eventId: string;
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  hourlyRate: number;
  attendance?: Attendance;
}

export default function PartTimerDashboard() {
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
        const [dailyAssignments, staffSalaries, attendanceRecords] = await Promise.all([
          getEventDailyAssignments(event.id),
          getEventStaffSalaries(event.id),
          getAttendanceByPartTimerAndEvent(partTimerId, event.id),
        ]);

        const staffSalary = staffSalaries.find(s => s.partTimerId === partTimerId);
        const hourlyRate = staffSalary ? parseFloat(staffSalary.salary) : 0;

        for (const assignment of dailyAssignments) {
          if (assignment.assignedPartTimers.includes(partTimerId)) {
            const attendance = attendanceRecords.find(a => a.date === assignment.date);

            assignments.push({
              eventId: event.id,
              eventName: event.name,
              date: assignment.date,
              startTime: event.startTime,
              endTime: event.endTime,
              location: event.location,
              hourlyRate,
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

  const handleLogout = () => {
    localStorage.removeItem('partTimerId');
    localStorage.removeItem('partTimerName');
    toast.success('Logged out successfully');
    navigate('/part-timer/login');
  };

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome, {partTimerName}</h1>
            <p className="text-sm text-muted-foreground">Manage your jobs and attendance</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
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
              {upcomingJobs.map((job, index) => {
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
                            <Camera className="w-4 h-4" />
                            Clock In
                          </Button>
                        )}
                        {canClockOut(job) && (
                          <Button onClick={() => handleClockOut(job)} variant="outline" className="gap-2 flex-1">
                            <Camera className="w-4 h-4" />
                            Clock Out
                          </Button>
                        )}
                        {job.attendance?.clockIn && job.attendance?.clockOut && (
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <div>Worked: {Number(job.attendance.hoursWorked || 0).toFixed(2)} hours</div>
                            {job.hourlyRate > 0 && (
                              <div className="font-medium text-primary">
                                Earned: RM {(Number(job.attendance.hoursWorked || 0) * job.hourlyRate).toFixed(2)}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({Number(job.attendance.hoursWorked || 0).toFixed(2)}h × RM {job.hourlyRate.toFixed(2)}/hr)
                                </span>
                              </div>
                            )}
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
            <h2 className="text-xl font-semibold mb-4">Past Jobs ({pastJobs.length})</h2>
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
    </div>
  );
}
