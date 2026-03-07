import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import type { Payroll, EventPayBreakdown } from '@/types';

interface PartTimerInfo {
  name: string;
  ic: string;
  bankName: string;
  bankAccount: string;
}

export function generatePayslipPDF(
  payroll: Payroll,
  partTimer: PartTimerInfo,
  mode: 'download' | 'preview' = 'download'
): jsPDF | void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Colors
  const primaryColor: [number, number, number] = [108, 180, 232]; // #6CB4E8
  const orangeColor: [number, number, number] = [245, 166, 74]; // #F5A64A

  // Header with company branding
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TERA DIET', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Payroll Slip', pageWidth / 2, 25, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  let yPos = 45;

  // Payroll period
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Payroll Period:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${format(parseISO(payroll.dateRangeStart), 'MMM d, yyyy')} - ${format(parseISO(payroll.dateRangeEnd), 'MMM d, yyyy')}`,
    60,
    yPos
  );

  yPos += 10;

  // Part-timer information section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Information', 20, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const employeeInfo = [
    ['Name:', partTimer.name],
    ['IC Number:', partTimer.ic],
    ['Bank:', partTimer.bankName],
    ['Account No:', partTimer.bankAccount],
  ];

  employeeInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Payment breakdown section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Breakdown', 20, yPos);
  yPos += 7;

  // Parse event breakdown if available
  let eventBreakdown: EventPayBreakdown[] = [];
  let basePay = 0;

  if (payroll.eventBreakdown) {
    try {
      eventBreakdown = JSON.parse(payroll.eventBreakdown);
      basePay = eventBreakdown.reduce((sum, item) => sum + item.salary, 0);
    } catch {
      // Fallback to hourly calculation
      basePay = parseFloat(payroll.totalHours.toString()) * parseFloat(payroll.rate.toString());
    }
  } else {
    basePay = parseFloat(payroll.totalHours.toString()) * parseFloat(payroll.rate.toString());
  }

  // Event breakdown table
  if (eventBreakdown.length > 0) {
    const eventTableData = eventBreakdown.map((item) => [
      item.eventName,
      `${item.daysWorked} ${item.daysWorked === 1 ? 'day' : 'days'}`,
      `RM ${item.salary.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Event Name', 'Days Worked', 'Amount']],
      body: eventTableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Summary table
  const summaryData = [
    ['Base Pay', `RM ${basePay.toFixed(2)}`],
    ['Allowance', `RM ${parseFloat(payroll.allowance.toString()).toFixed(2)}`],
    ['Incentive', `RM ${parseFloat(payroll.incentive.toString()).toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: 'bold' },
      1: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  // Total pay
  doc.setFillColor(...orangeColor);
  doc.rect(20, yPos, pageWidth - 40, 12, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PAY', 25, yPos + 8);
  doc.text(
    `RM ${parseFloat(payroll.totalPay.toString()).toFixed(2)}`,
    pageWidth - 25,
    yPos + 8,
    { align: 'right' }
  );

  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Generated on ${format(new Date(), 'MMM d, yyyy')}`,
    pageWidth / 2,
    doc.internal.pageSize.height - 15,
    { align: 'center' }
  );

  doc.setFontSize(8);
  doc.text(
    'This is a computer-generated document. No signature is required.',
    pageWidth / 2,
    doc.internal.pageSize.height - 10,
    { align: 'center' }
  );

  if (mode === 'download') {
    // Download the PDF
    const filename = `Payslip_${partTimer.name.replace(/\s+/g, '_')}_${format(parseISO(payroll.dateRangeStart), 'yyyy-MM')}.pdf`;
    doc.save(filename);
  } else {
    // Return the PDF for preview
    return doc;
  }
}

export function previewPayslipPDF(payroll: Payroll, partTimer: PartTimerInfo): string {
  const doc = generatePayslipPDF(payroll, partTimer, 'preview');
  if (doc) {
    return doc.output('dataurlstring');
  }
  return '';
}
