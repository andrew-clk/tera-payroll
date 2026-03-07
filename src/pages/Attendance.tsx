import { useState, useMemo } from 'react';
import { Search, Clock, CheckCircle2, AlertCircle, Camera, Loader2, Plus, Image, Edit, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAttendance, usePartTimers, useEvents, useUpdateAttendance, useEventDailyAssignments } from '@/hooks/useDatabase';
import { AttendanceDialog } from '@/components/attendance/AttendanceDialog';
import { PhotoViewerDialog } from '@/components/attendance/PhotoViewerDialog';
import { format, parseISO, isToday, isFuture, isPast, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { toNumber } from '@/types';
import type { Attendance as AttendanceType } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface EditClockInDialogProps {
  attendance: AttendanceType | null;
  onClose: () => void;
  partTimerName: string;
  eventName: string;
}

function EditClockInDialog({ attendance, onClose, partTimerName, eventName }: EditClockInDialogProps) {
  const [clockInTime, setClockInTime] = useState(
    attendance?.clockIn ? format(new Date(attendance.clockIn), 'HH:mm') : ''
  );
  const updateMutation = useUpdateAttendance();

  const handleSave = async () => {
    if (!attendance || !clockInTime) return;

    try {
      const [hours, minutes] = clockInTime.split(':');
      const newClockIn = new Date(attendance.clockIn || new Date());
      newClockIn.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await updateMutation.mutateAsync({
        id: attendance.id,
        data: { clockIn: newClockIn.toISOString() }
      });

      toast.success('Clock-in time updated');
      onClose();
    } catch (error) {
      toast.error('Failed to update clock-in time');
    }
  };

  return (
    <Dialog open={!!attendance} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Clock-In Time</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Part-Timer</p>
            <p className="font-medium">{partTimerName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Event</p>
            <p className="font-medium">{eventName}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Clock-In Time</label>
            <Input
              type="time"
              value={clockInTime}
              onChange={(e) => setClockInTime(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Attendance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [isClockInDialogOpen, setIsClockInDialogOpen] = useState(false);
  const [clockingOutAttendance, setClockingOutAttendance] = useState<AttendanceType | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceType | null>(null);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceType | null>(null);
  const [activeTab, setActiveTab] = useState('ongoing');

  const handleViewPhotos = (record: AttendanceType) => {
    setSelectedAttendance(record);
    setPhotoViewerOpen(true);
  };

  const { data: attendance, isLoading: isLoadingAttendance } = useAttendance();
  const { data: partTimers, isLoading: isLoadingPartTimers } = usePartTimers();
  const { data: events, isLoading: isLoadingEvents } = useEvents();
  const { data: dailyAssignments, isLoading: isLoadingAssignments } = useEventDailyAssignments();

  const getPartTimerName = (id: string) => (partTimers ?? []).find(p => p.id === id)?.name || 'Unknown';
  const getEventName = (id: string) => (events ?? []).find(e => e.id === id)?.name || 'Unknown';

  // Merge attendance with event daily assignments to show expected attendance
  const allAttendanceRecords = useMemo(() => {
    const records: (AttendanceType & { isExpected?: boolean })[] = [...(attendance ?? [])];

    // For each daily assignment, check if attendance record exists, if not create a virtual one
    (dailyAssignments ?? []).forEach(assignment => {
      (assignment.assignedPartTimers ?? []).forEach(partTimerId => {
        // Check if attendance record exists for this combination
        const existingRecord = attendance?.find(
          att => att.partTimerId === partTimerId &&
                 att.eventId === assignment.eventId &&
                 att.date === assignment.date
        );

        if (!existingRecord) {
          // Create a virtual pending attendance record
          records.push({
            id: `virtual-${assignment.id}-${partTimerId}`,
            partTimerId,
            eventId: assignment.eventId,
            date: assignment.date,
            clockIn: null,
            clockOut: null,
            clockInPhoto: null,
            clockOutPhoto: null,
            hoursWorked: null,
            status: 'pending' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            isExpected: true, // Flag to indicate this is a virtual record
          });
        }
      });
    });

    return records;
  }, [attendance, dailyAssignments]);

  // Filter for ongoing events tab - includes today's and future attendance
  const ongoingAttendance = allAttendanceRecords.filter(att => {
    const attDate = parseISO(att.date);
    return isToday(attDate) || isFuture(attDate);
  });

  // Filter for history tab - includes past attendance (only real records, not expected)
  const historyAttendance = allAttendanceRecords.filter(att => {
    const attDate = parseISO(att.date);
    return isPast(attDate) && !isToday(attDate) && !att.isExpected;
  });

  // Apply search and event filters
  const applyFilters = (records: AttendanceType[]) => {
    return records.filter(att => {
      const partTimerName = getPartTimerName(att.partTimerId).toLowerCase();
      const eventName = getEventName(att.eventId).toLowerCase();
      const matchesSearch = partTimerName.includes(searchQuery.toLowerCase()) ||
                            eventName.includes(searchQuery.toLowerCase());
      const matchesEvent = eventFilter === 'all' || att.eventId === eventFilter;
      return matchesSearch && matchesEvent;
    }).sort((a, b) => {
      // Sort by attendance date (earliest first)
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const filteredOngoing = applyFilters(ongoingAttendance);
  const filteredHistory = applyFilters(historyAttendance);

  const statusConfig = {
    'clocked-in': { icon: Clock, color: 'text-info bg-info/10', label: 'Clocked In' },
    'completed': { icon: CheckCircle2, color: 'text-success bg-success/10', label: 'Completed' },
    'pending': { icon: AlertCircle, color: 'text-warning bg-warning/10', label: 'Pending' },
  };

  if (isLoadingAttendance || isLoadingPartTimers || isLoadingEvents || isLoadingAssignments) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  const renderAttendanceCard = (attendanceRecord: AttendanceType, index: number) => {
    const StatusIcon = statusConfig[attendanceRecord.status].icon;
    const attDate = parseISO(attendanceRecord.date);
    const isTodayEvent = isToday(attDate);
    const showWarning = isTodayEvent && attendanceRecord.status === 'pending';

    return (
      <div
        key={attendanceRecord.id}
        className={cn(
          "bg-card rounded-xl border p-5 animate-slide-up hover:shadow-soft transition-shadow",
          showWarning ? "border-warning bg-warning/5" : "border-border"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
              {getPartTimerName(attendanceRecord.partTimerId).split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{getPartTimerName(attendanceRecord.partTimerId)}</h3>
                {showWarning && (
                  <span className="flex items-center gap-1 text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Haven't Clocked In
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{getEventName(attendanceRecord.eventId)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(attDate, 'EEE, MMM d, yyyy')}
                {isTodayEvent && <span className="ml-2 text-primary font-medium">Today</span>}
                {isFuture(attDate) && <span className="ml-2 text-muted-foreground">Upcoming</span>}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="text-sm">
              <p className="text-muted-foreground">Clock In</p>
              <p className="font-medium">{attendanceRecord.clockIn ? format(new Date(attendanceRecord.clockIn), 'h:mm a') : '-'}</p>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground">Clock Out</p>
              <p className="font-medium">{attendanceRecord.clockOut ? format(new Date(attendanceRecord.clockOut), 'h:mm a') : '-'}</p>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground">Hours</p>
              <p className="font-medium">{attendanceRecord.hoursWorked ? toNumber(attendanceRecord.hoursWorked).toFixed(2) : '-'}</p>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              statusConfig[attendanceRecord.status].color
            )}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig[attendanceRecord.status].label}
            </div>
            {attendanceRecord.clockIn && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => setEditingAttendance(attendanceRecord)}
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
            {attendanceRecord.status === 'clocked-in' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setClockingOutAttendance(attendanceRecord)}
              >
                <Clock className="w-4 h-4" />
                Clock Out
              </Button>
            )}
            {(attendanceRecord.clockInPhoto || attendanceRecord.clockOutPhoto) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleViewPhotos(attendanceRecord)}
              >
                <Image className="w-4 h-4" />
                View Photos
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track part-timer clock-in and clock-out records</p>
        </div>
        <Button className="gap-2" onClick={() => setIsClockInDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Clock In
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {(events ?? []).map(event => (
              <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold">{(attendance ?? []).filter(a => a.status === 'clocked-in').length}</p>
            <p className="text-sm text-muted-foreground">Currently Clocked In</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{(attendance ?? []).filter(a => a.status === 'completed').length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{(attendance ?? []).reduce((sum, a) => sum + toNumber(a.hoursWorked), 0).toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Total Hours</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ongoing" className="gap-2">
            <Calendar className="w-4 h-4" />
            Ongoing Events
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="w-4 h-4" />
            Attendance History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ongoing" className="space-y-3">
          {filteredOngoing.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No ongoing events found</p>
            </div>
          ) : (
            filteredOngoing.map((record, index) => renderAttendanceCard(record, index))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No attendance history found</p>
            </div>
          ) : (
            filteredHistory.map((record, index) => renderAttendanceCard(record, index))
          )}
        </TabsContent>
      </Tabs>

      {/* Clock In Dialog */}
      <AttendanceDialog
        open={isClockInDialogOpen}
        onOpenChange={setIsClockInDialogOpen}
        mode="clock-in"
      />

      {/* Clock Out Dialog */}
      <AttendanceDialog
        open={!!clockingOutAttendance}
        onOpenChange={(open) => !open && setClockingOutAttendance(null)}
        attendance={clockingOutAttendance}
        mode="clock-out"
      />

      {/* Edit Clock-In Dialog */}
      <EditClockInDialog
        attendance={editingAttendance}
        onClose={() => setEditingAttendance(null)}
        partTimerName={editingAttendance ? getPartTimerName(editingAttendance.partTimerId) : ''}
        eventName={editingAttendance ? getEventName(editingAttendance.eventId) : ''}
      />

      {/* Photo Viewer Dialog */}
      {selectedAttendance && (
        <PhotoViewerDialog
          open={photoViewerOpen}
          onOpenChange={setPhotoViewerOpen}
          clockInPhoto={selectedAttendance.clockInPhoto}
          clockOutPhoto={selectedAttendance.clockOutPhoto}
          partTimerName={getPartTimerName(selectedAttendance.partTimerId)}
          eventName={getEventName(selectedAttendance.eventId)}
        />
      )}
    </div>
  );
}
