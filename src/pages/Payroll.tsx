import { useState } from 'react';
import { Search, Filter, FileText, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockPayroll, mockPartTimers } from '@/data/mockData';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Payroll } from '@/types';

export default function PayrollPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  const getPartTimerName = (id: string) => mockPartTimers.find(p => p.id === id)?.name || 'Unknown';

  const filteredPayroll = mockPayroll.filter(p => {
    const partTimerName = getPartTimerName(p.partTimerId).toLowerCase();
    const matchesSearch = partTimerName.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredPayroll.reduce((sum, p) => sum + p.totalPay, 0);
  const draftCount = mockPayroll.filter(p => p.status === 'draft').length;
  const confirmedCount = mockPayroll.filter(p => p.status === 'confirmed').length;

  const statusConfig = {
    draft: { color: 'badge-pending', label: 'Draft' },
    confirmed: { color: 'badge-active', label: 'Confirmed' },
    paid: { color: 'bg-info/10 text-info', label: 'Paid' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">Generate and manage payroll records</p>
        </div>
        <Button className="gap-2">
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
        {filteredPayroll.map((payroll, index) => (
          <div 
            key={payroll.id}
            onClick={() => setSelectedPayroll(payroll)}
            className="bg-card rounded-xl border border-border p-5 cursor-pointer hover:shadow-soft transition-shadow animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                  {getPartTimerName(payroll.partTimerId).split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{getPartTimerName(payroll.partTimerId)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(payroll.dateRangeStart), 'MMM d')} - {format(parseISO(payroll.dateRangeEnd), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="text-sm">
                  <p className="text-muted-foreground">Hours</p>
                  <p className="font-medium">{payroll.totalHours}</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Rate</p>
                  <p className="font-medium">RM {payroll.rate}/hr</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Allowances</p>
                  <p className="font-medium">RM {(payroll.transportAllowance + payroll.mealAllowance + payroll.bonus).toFixed(2)}</p>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="text-lg font-bold text-foreground">RM {payroll.totalPay.toFixed(2)}</p>
                  <span className={cn("badge-status", statusConfig[payroll.status].color)}>
                    {statusConfig[payroll.status].label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                    {format(parseISO(selectedPayroll.dateRangeStart), 'MMM d')} - {format(parseISO(selectedPayroll.dateRangeEnd), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Total Hours</span>
                  <span className="font-medium">{selectedPayroll.totalHours} hrs</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="font-medium">RM {selectedPayroll.rate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-border pt-3">
                  <span className="text-muted-foreground">Base Pay</span>
                  <span className="font-medium">RM {(selectedPayroll.totalHours * selectedPayroll.rate).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Transport Allowance</span>
                  <span className="font-medium">RM {selectedPayroll.transportAllowance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Meal Allowance</span>
                  <span className="font-medium">RM {selectedPayroll.mealAllowance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Bonus</span>
                  <span className="font-medium">RM {selectedPayroll.bonus.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-primary/20 bg-primary/5 -mx-6 px-6 mt-4">
                  <span className="font-semibold text-lg">Total Pay</span>
                  <span className="font-bold text-lg text-primary">RM {selectedPayroll.totalPay.toFixed(2)}</span>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                {selectedPayroll.status === 'draft' ? (
                  <>
                    <Button variant="outline" className="flex-1 gap-2">
                      <FileText className="w-4 h-4" />
                      Generate PDF
                    </Button>
                    <Button className="flex-1 gap-2">
                      <Lock className="w-4 h-4" />
                      Confirm Payroll
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full gap-2">
                    <FileText className="w-4 h-4" />
                    Download Payslip
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
