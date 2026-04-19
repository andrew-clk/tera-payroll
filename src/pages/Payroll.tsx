import { useState, useMemo } from 'react';
import { Search, Filter, FileText, Lock, CheckCircle2, Loader2, Download, Eye, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePayroll, usePartTimers, useEvents, useAttendance, useDeletePayroll } from '@/hooks/useDatabase';
import { format, parseISO, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { toNumber, type EventPayBreakdown } from '@/types';
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
import { Payroll } from '@/types';
import { GeneratePayrollDialog } from '@/components/payroll/GeneratePayrollDialog';
import { PayslipPreviewDialog } from '@/components/payroll/PayslipPreviewDialog';
import { generatePayslipPDF } from '@/lib/generatePayslipPDF';
import { toast } from 'sonner';

export default function PayrollPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [previewPayroll, setPreviewPayroll] = useState<Payroll | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('records');

  const { data: payroll, isLoading: isLoadingPayroll } = usePayroll();
  const { data: partTimers, isLoading: isLoadingPartTimers } = usePartTimers();
  const { data: events, isLoading: isLoadingEvents } = useEvents();
  const { data: attendance, isLoading: isLoadingAttendance } = useAttendance();
  const deleteMutation = useDeletePayroll();

  const getPartTimerName = (id: string) => (partTimers ?? []).find(p => p.id === id)?.name || 'Unknown';
  const getPartTimer = (id: string) => (partTimers ?? []).find(p => p.id === id);

  const handleDeletePayroll = async (payrollItem: Payroll) => {
    const name = getPartTimerName(payrollItem.partTimerId);
    const range = `${format(new Date(payrollItem.dateRangeStart), 'MMM d')} – ${format(new Date(payrollItem.dateRangeEnd), 'MMM d, yyyy')}`;
    if (!window.confirm(`Delete payroll for ${name} (${range})? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(payrollItem.id);
      if (selectedPayroll?.id === payrollItem.id) setSelectedPayroll(null);
      toast.success('Payroll deleted');
    } catch {
      toast.error('Failed to delete payroll');
    }
  };

  const handleDownloadPayslip = (payrollItem: Payroll) => {
    const partTimer = getPartTimer(payrollItem.partTimerId);
    if (partTimer) {
      generatePayslipPDF(
        payrollItem,
        {
          name: partTimer.name,
          ic: partTimer.ic,
          bankName: partTimer.bankName,
          bankAccount: partTimer.bankAccount,
        },
        'download'
      );
    }
  };

  const handlePreviewPayslip = (payrollItem: Payroll) => {
    setPreviewPayroll(payrollItem);
    setPreviewDialogOpen(true);
  };

  const filteredPayroll = (payroll ?? []).filter(p => {
    const partTimerName = getPartTimerName(p.partTimerId).toLowerCase();
    const matchesSearch = partTimerName.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredPayroll.reduce((sum, p) => sum + toNumber(p.totalPay), 0);
  const draftCount = (payroll ?? []).filter(p => p.status === 'draft').length;
  const confirmedCount = (payroll ?? []).filter(p => p.status === 'confirmed').length;

  // Calculate unpaid jobs - completed events with attendance but no payroll generated
  const unpaidJobs = useMemo(() => {
    if (!events || !attendance || !payroll || !partTimers) return [];

    const completedEvents = (events ?? []).filter(event =>
      isPast(parseISO(event.endDate))
    );

    const unpaidList: Array<{
      eventId: string;
      eventName: string;
      eventDate: string;
      partTimerId: string;
      partTimerName: string;
      attendanceCount: number;
    }> = [];

    completedEvents.forEach(event => {
      // Get all attendance for this event
      const eventAttendance = (attendance ?? []).filter(att => att.eventId === event.id);

      // Group by part-timer
      const partTimerIds = [...new Set(eventAttendance.map(att => att.partTimerId))];

      partTimerIds.forEach(partTimerId => {
        // Check if payroll exists for this part-timer covering this event date
        const hasPayroll = (payroll ?? []).some(p =>
          p.partTimerId === partTimerId &&
          event.endDate >= p.dateRangeStart &&
          event.endDate <= p.dateRangeEnd
        );

        if (!hasPayroll) {
          const partTimerAttendance = eventAttendance.filter(att => att.partTimerId === partTimerId);
          const partTimer = (partTimers ?? []).find(pt => pt.id === partTimerId);

          if (partTimer && partTimerAttendance.length > 0) {
            unpaidList.push({
              eventId: event.id,
              eventName: event.name,
              eventDate: event.endDate,
              partTimerId,
              partTimerName: partTimer.name,
              attendanceCount: partTimerAttendance.length,
            });
          }
        }
      });
    });

    return unpaidList;
  }, [events, attendance, payroll, partTimers]);

  const statusConfig = {
    draft: { color: 'badge-pending', label: 'Draft' },
    confirmed: { color: 'badge-active', label: 'Confirmed' },
    paid: { color: 'bg-info/10 text-info', label: 'Paid' },
  };

  if (isLoadingPayroll || isLoadingPartTimers || isLoadingEvents || isLoadingAttendance) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">Generate and manage payroll records</p>
        </div>
        <Button className="gap-2" onClick={() => setGenerateDialogOpen(true)}>
          <FileText className="w-4 h-4" />
          Generate Payroll
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold text-foreground">RM {totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Draft Records</p>
          <p className="text-2xl font-bold text-warning">{draftCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Confirmed Records</p>
          <p className="text-2xl font-bold text-success">{confirmedCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="records">
            Payroll Records
            {payroll && payroll.length > 0 && (
              <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                {payroll.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unpaid">
            Unpaid Jobs
            {unpaidJobs.length > 0 && (
              <span className="ml-2 bg-warning/20 text-warning px-2 py-0.5 rounded-full text-xs font-semibold">
                {unpaidJobs.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Payroll Records Tab */}
        <TabsContent value="records" className="space-y-6 mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by part-timer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payroll List */}
      <div className="space-y-3">
        {filteredPayroll.map((payrollItem, index) => (
          <div
            key={payrollItem.id}
            className="bg-card rounded-xl border border-border p-5 hover:shadow-soft transition-shadow animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div
                className="flex items-center gap-4 flex-1 cursor-pointer"
                onClick={() => setSelectedPayroll(payrollItem)}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                  {getPartTimerName(payrollItem.partTimerId).split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{getPartTimerName(payrollItem.partTimerId)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(payrollItem.dateRangeStart), 'MMM d')} - {format(new Date(payrollItem.dateRangeEnd), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="text-sm hidden md:block">
                  <p className="text-muted-foreground">Allowances & Incentives</p>
                  <p className="font-medium">RM {(toNumber(payrollItem.allowance) + toNumber(payrollItem.incentive)).toFixed(2)}</p>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="text-lg font-bold text-foreground">RM {toNumber(payrollItem.totalPay).toFixed(2)}</p>
                  <span className={cn("badge-status", statusConfig[payrollItem.status].color)}>
                    {statusConfig[payrollItem.status].label}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewPayslip(payrollItem);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPayslip(payrollItem);
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePayroll(payrollItem);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
        </TabsContent>

        {/* Unpaid Jobs Tab */}
        <TabsContent value="unpaid" className="space-y-6 mt-6">
          {unpaidJobs.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Jobs Paid!</h3>
              <p className="text-muted-foreground">There are no unpaid jobs at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unpaidJobs.map((job, index) => (
                <div
                  key={`${job.eventId}-${job.partTimerId}`}
                  className="bg-card rounded-xl border border-warning/30 p-5 hover:shadow-soft transition-shadow animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-warning" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{job.partTimerName}</h3>
                          <span className="badge-status badge-pending">Unpaid</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {job.eventName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Event Date: {format(parseISO(job.eventDate), 'MMM d, yyyy')} • {job.attendanceCount} {job.attendanceCount === 1 ? 'attendance' : 'attendances'}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="gap-2"
                      onClick={() => setGenerateDialogOpen(true)}
                    >
                      <FileText className="w-4 h-4" />
                      Generate Payroll
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Payroll Details Dialog */}
      <Dialog open={!!selectedPayroll} onOpenChange={() => setSelectedPayroll(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-6">
              {/* Part Timer Info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold">
                  {getPartTimerName(selectedPayroll.partTimerId).split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{getPartTimerName(selectedPayroll.partTimerId)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedPayroll.dateRangeStart), 'MMM d')} - {format(new Date(selectedPayroll.dateRangeEnd), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                {/* Event Breakdown */}
                {selectedPayroll.eventBreakdown && (() => {
                  try {
                    const breakdown = JSON.parse(selectedPayroll.eventBreakdown) as EventPayBreakdown[];
                    return (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">Event Breakdown</h4>
                        {breakdown.map((item) => (
                          <div key={item.eventId} className="flex justify-between py-2 bg-muted/30 px-3 rounded">
                            <div>
                              <span className="font-medium">{item.eventName}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({item.daysWorked} {item.daysWorked === 1 ? 'day' : 'days'}
                                {item.hoursWorked != null ? ` · ${Number(item.hoursWorked).toFixed(2)}h × RM ${Number(item.hourlyRate ?? 0).toFixed(2)}/hr` : ''})
                              </span>
                            </div>
                            <span className="font-medium">RM {item.salary.toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between py-2 border-t border-border pt-3">
                          <span className="text-muted-foreground">Base Pay (Events)</span>
                          <span className="font-medium">RM {breakdown.reduce((sum, item) => sum + item.salary, 0).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  } catch {
                    // Fallback to old hourly-based display if parsing fails
                    return (
                      <>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Total Hours</span>
                          <span className="font-medium">{toNumber(selectedPayroll.totalHours).toFixed(2)} hrs</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Hourly Rate</span>
                          <span className="font-medium">RM {toNumber(selectedPayroll.rate).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-t border-border pt-3">
                          <span className="text-muted-foreground">Base Pay</span>
                          <span className="font-medium">RM {(toNumber(selectedPayroll.totalHours) * toNumber(selectedPayroll.rate)).toFixed(2)}</span>
                        </div>
                      </>
                    );
                  }
                })()}

                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Allowance</span>
                  <span className="font-medium">RM {toNumber(selectedPayroll.allowance).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Incentive</span>
                  <span className="font-medium">RM {toNumber(selectedPayroll.incentive).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-primary/20 bg-primary/5 -mx-6 px-6 mt-4">
                  <span className="font-semibold text-lg">Total Pay</span>
                  <span className="font-bold text-lg text-primary">RM {toNumber(selectedPayroll.totalPay).toFixed(2)}</span>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => handlePreviewPayslip(selectedPayroll)}
                >
                  <FileText className="w-4 h-4" />
                  Preview Payslip
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => handleDownloadPayslip(selectedPayroll)}
                >
                  <FileText className="w-4 h-4" />
                  Download PDF
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Payroll Dialog */}
      <GeneratePayrollDialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen} />

      {/* Payslip Preview Dialog */}
      {previewPayroll && (
        <PayslipPreviewDialog
          open={previewDialogOpen}
          onOpenChange={(open) => {
            setPreviewDialogOpen(open);
            if (!open) setPreviewPayroll(null);
          }}
          payroll={previewPayroll}
          partTimerName={getPartTimer(previewPayroll.partTimerId)?.name || ''}
          partTimerIc={getPartTimer(previewPayroll.partTimerId)?.ic || ''}
          partTimerBankName={getPartTimer(previewPayroll.partTimerId)?.bankName || ''}
          partTimerBankAccount={getPartTimer(previewPayroll.partTimerId)?.bankAccount || ''}
        />
      )}
    </div>
  );
}
