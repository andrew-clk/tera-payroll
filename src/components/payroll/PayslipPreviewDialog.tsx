import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { previewPayslipPDF, generatePayslipPDF } from '@/lib/generatePayslipPDF';
import type { Payroll } from '@/types';

interface AttendanceRow {
  partTimerId: string;
  eventId: string;
  date: string;
  clockIn?: string | null;
  clockOut?: string | null;
  hoursWorked?: string | number | null;
  status: string;
}

interface EventInfo {
  id: string;
  name: string;
}

interface StaffSalaryInfo {
  eventId: string;
  partTimerId: string;
  salary: string | number;
}

interface PayslipPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: Payroll | null;
  partTimerName: string;
  partTimerIc: string;
  partTimerBankName: string;
  partTimerBankAccount: string;
  attendanceRecords?: AttendanceRow[];
  events?: EventInfo[];
  staffSalaries?: StaffSalaryInfo[];
}

export function PayslipPreviewDialog({
  open,
  onOpenChange,
  payroll,
  partTimerName,
  partTimerIc,
  partTimerBankName,
  partTimerBankAccount,
  attendanceRecords,
  events,
  staffSalaries,
}: PayslipPreviewDialogProps) {
  const [pdfDataUrl, setPdfDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (open && payroll) {
      setIsGenerating(true);
      setTimeout(() => {
        const dataUrl = previewPayslipPDF(
          payroll,
          { name: partTimerName, ic: partTimerIc, bankName: partTimerBankName, bankAccount: partTimerBankAccount },
          attendanceRecords,
          events,
          staffSalaries
        );
        setPdfDataUrl(dataUrl);
        setIsGenerating(false);
      }, 100);
    } else {
      setPdfDataUrl('');
    }
  }, [open, payroll, partTimerName, partTimerIc, partTimerBankName, partTimerBankAccount, attendanceRecords, events, staffSalaries]);

  const handleDownload = () => {
    if (payroll) {
      generatePayslipPDF(
        payroll,
        { name: partTimerName, ic: partTimerIc, bankName: partTimerBankName, bankAccount: partTimerBankAccount },
        'download',
        attendanceRecords,
        events,
        staffSalaries
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payslip Preview</span>
            <Button onClick={handleDownload} className="gap-2" size="sm">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating preview...</p>
              </div>
            </div>
          ) : pdfDataUrl ? (
            <iframe
              src={pdfDataUrl}
              className="w-full h-full min-h-[600px]"
              title="Payslip Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <p className="text-sm text-muted-foreground">No preview available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
