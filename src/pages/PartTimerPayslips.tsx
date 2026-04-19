import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, FileText, Eye, Calendar, DollarSign } from 'lucide-react';
import { getAllPayroll, getPartTimerById } from '@/db/queries';
import { format, parseISO } from 'date-fns';
import { PartTimerLayout } from '@/components/part-timer/PartTimerLayout';
import { PayslipPreviewDialog } from '@/components/payroll/PayslipPreviewDialog';
import { generatePayslipPDF } from '@/lib/generatePayslipPDF';
import { toNumber, type Payroll, type EventPayBreakdown } from '@/types';

export default function PartTimerPayslips() {
  const navigate = useNavigate();
  const [partTimerId, setPartTimerId] = useState<string>('');
  const [partTimerName, setPartTimerName] = useState<string>('');
  const [partTimerData, setPartTimerData] = useState<any>(null);
  const [payslips, setPayslips] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payroll | null>(null);

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

    // Load part-timer data and payslips
    const loadData = async () => {
      setIsLoading(true);

      // Get part-timer details
      const pt = await getPartTimerById(ptId);
      setPartTimerData(pt);

      // Get all payroll records for this part-timer
      const allPayroll = await getAllPayroll();
      const myPayslips = allPayroll.filter(p => p.partTimerId === ptId);

      // Sort by date (most recent first)
      myPayslips.sort((a, b) => {
        return new Date(b.dateRangeEnd).getTime() - new Date(a.dateRangeEnd).getTime();
      });

      setPayslips(myPayslips);
      setIsLoading(false);
    };

    if (ptId) {
      loadData();
    }
  }, [navigate]);

  const handlePreview = (payslip: Payroll) => {
    setSelectedPayslip(payslip);
    setPreviewDialogOpen(true);
  };

  const handleDownload = (payslip: Payroll) => {
    if (partTimerData) {
      generatePayslipPDF(
        payslip,
        {
          name: partTimerData.name,
          ic: partTimerData.ic,
          bankName: partTimerData.bankName,
          bankAccount: partTimerData.bankAccount,
        },
        'download'
      );
    }
  };

  const statusConfig = {
    draft: { color: 'badge-pending', label: 'Draft' },
    confirmed: { color: 'badge-active', label: 'Confirmed' },
    paid: { color: 'bg-success/10 text-success', label: 'Paid' },
  };

  const totalEarnings = payslips
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + toNumber(p.totalPay), 0);

  const pendingPayments = payslips
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + toNumber(p.totalPay), 0);

  if (isLoading) {
    return (
      <PartTimerLayout partTimerName={partTimerName}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading payslips...</p>
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
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">RM {totalEarnings.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">RM {pendingPayments.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{payslips.length}</p>
                  <p className="text-sm text-muted-foreground">Total Payslips</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payslips List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">My Payslips</h2>
          {payslips.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No payslips available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payslips.map((payslip) => {
                let eventBreakdown: EventPayBreakdown[] = [];
                try {
                  if (payslip.eventBreakdown) {
                    eventBreakdown = JSON.parse(payslip.eventBreakdown);
                  }
                } catch {}

                return (
                  <Card key={payslip.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            Payslip for {format(parseISO(payslip.dateRangeStart), 'MMM d')} - {format(parseISO(payslip.dateRangeEnd), 'MMM d, yyyy')}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {eventBreakdown.length > 0 ? (
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">Events:</p>
                                {eventBreakdown.map((event, idx) => (
                                  <div key={idx} className="text-sm flex justify-between">
                                    <span>
                                      {event.eventName}
                                      {event.hoursWorked != null
                                        ? ` — ${Number(event.hoursWorked).toFixed(2)}h × RM ${Number(event.hourlyRate ?? 0).toFixed(2)}/hr`
                                        : ` (${event.daysWorked} ${event.daysWorked === 1 ? 'day' : 'days'})`}
                                    </span>
                                    <span className="font-medium">RM {event.salary.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm">
                                {toNumber(payslip.totalHours).toFixed(1)} hours @ RM {toNumber(payslip.rate).toFixed(2)}/hr
                              </div>
                            )}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            RM {toNumber(payslip.totalPay).toFixed(2)}
                          </div>
                          <span className={`badge-status ${statusConfig[payslip.status].color} text-xs mt-1`}>
                            {statusConfig[payslip.status].label}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 flex-1"
                          onClick={() => handlePreview(payslip)}
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          className="gap-2 flex-1"
                          onClick={() => handleDownload(payslip)}
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payslip Preview Dialog */}
      {selectedPayslip && partTimerData && (
        <PayslipPreviewDialog
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
          payroll={selectedPayslip}
          partTimerName={partTimerData.name}
          partTimerIc={partTimerData.ic}
          partTimerBankName={partTimerData.bankName}
          partTimerBankAccount={partTimerData.bankAccount}
        />
      )}
    </PartTimerLayout>
  );
}
