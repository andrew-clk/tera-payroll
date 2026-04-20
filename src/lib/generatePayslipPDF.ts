import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import type { Payroll } from '@/types';

interface PartTimerInfo {
  name: string;
  ic: string;
  bankName: string;
  bankAccount: string;
}

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

function fmt(ts: string | null | undefined): string {
  if (!ts) return '—';
  try {
    return format(new Date(ts), 'HH:mm');
  } catch {
    return '—';
  }
}

function toNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

export function generatePayslipPDF(
  payroll: Payroll,
  partTimer: PartTimerInfo,
  mode: 'download' | 'preview' = 'download',
  attendanceRecords?: AttendanceRow[],
  events?: EventInfo[],
  staffSalaries?: StaffSalaryInfo[]
): jsPDF | void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  const primaryColor: [number, number, number] = [108, 180, 232];
  const orangeColor: [number, number, number] = [245, 166, 74];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TERA DIET', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Payroll Slip', pageWidth / 2, 25, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  let yPos = 45;

  // Payroll period
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Payroll Period:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${format(parseISO(payroll.dateRangeStart), 'MMM d, yyyy')} – ${format(parseISO(payroll.dateRangeEnd), 'MMM d, yyyy')}`,
    62, yPos
  );
  yPos += 10;

  // Employee info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Information', 20, yPos);
  yPos += 7;

  doc.setFontSize(10);
  [
    ['Name:', partTimer.name],
    ['IC Number:', partTimer.ic],
    ['Bank:', partTimer.bankName],
    ['Account No:', partTimer.bankAccount],
  ].forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Payment breakdown heading
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Breakdown', 20, yPos);
  yPos += 7;

  let basePay = 0;

  // Build per-date rows from attendance records if available
  const completedAttendance = (attendanceRecords ?? [])
    .filter(a =>
      a.partTimerId === payroll.partTimerId &&
      a.status === 'completed' &&
      a.date >= payroll.dateRangeStart &&
      a.date <= payroll.dateRangeEnd
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  if (completedAttendance.length > 0 && events && staffSalaries) {
    const eventMap = Object.fromEntries((events ?? []).map(e => [e.id, e.name]));

    const tableRows = completedAttendance.map(a => {
      const eventName = eventMap[a.eventId] ?? '—';
      const rate = (staffSalaries ?? []).find(s => s.eventId === a.eventId && s.partTimerId === a.partTimerId);
      const hourlyRate = toNum(rate?.salary);
      const hours = toNum(a.hoursWorked);
      const dailyPay = hours * hourlyRate;
      basePay += dailyPay;

      return [
        format(parseISO(a.date), 'EEE, MMM d'),
        eventName,
        fmt(a.clockIn),
        fmt(a.clockOut),
        `${hours.toFixed(2)} h`,
        `RM ${dailyPay.toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Event', 'Clock In', 'Clock Out', 'Hours', 'Amount']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 52 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 26, halign: 'right' },
      },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;
  } else {
    // Fallback: show event-level summary from stored eventBreakdown JSON
    if (payroll.eventBreakdown) {
      try {
        const breakdown = JSON.parse(payroll.eventBreakdown);
        const tableRows = breakdown.map((item: any) => {
          const hours = toNum(item.hoursWorked);
          const rate = toNum(item.hourlyRate);
          basePay += toNum(item.salary);
          return [
            item.eventName,
            `${item.daysWorked} day(s)`,
            `${hours.toFixed(2)} h`,
            `RM ${toNum(item.hourlyRate).toFixed(2)}/hr`,
            `RM ${toNum(item.salary).toFixed(2)}`,
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Event', 'Days', 'Hours', 'Rate', 'Amount']],
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 65 },
            1: { cellWidth: 22, halign: 'center' },
            2: { cellWidth: 22, halign: 'center' },
            3: { cellWidth: 30, halign: 'center' },
            4: { cellWidth: 31, halign: 'right' },
          },
          margin: { left: 20, right: 20 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 5;
      } catch {
        basePay = toNum(payroll.totalHours) * toNum(payroll.rate);
      }
    } else {
      basePay = toNum(payroll.totalHours) * toNum(payroll.rate);
    }
  }

  // Summary table
  const allowance = toNum(payroll.allowance);
  const incentive = toNum(payroll.incentive);

  autoTable(doc, {
    startY: yPos,
    body: [
      ['Base Pay', `RM ${basePay.toFixed(2)}`],
      ['Allowance', `RM ${allowance.toFixed(2)}`],
      ['Incentive', `RM ${incentive.toFixed(2)}`],
    ],
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: 'bold' },
      1: { cellWidth: 50, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  // Total pay bar
  doc.setFillColor(...orangeColor);
  doc.rect(20, yPos, pageWidth - 40, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PAY', 25, yPos + 8);
  doc.text(`RM ${toNum(payroll.totalPay).toFixed(2)}`, pageWidth - 25, yPos + 8, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy')}`, pageWidth / 2, doc.internal.pageSize.height - 15, { align: 'center' });
  doc.setFontSize(8);
  doc.text('This is a computer-generated document. No signature is required.', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });

  if (mode === 'download') {
    const filename = `Payslip_${partTimer.name.replace(/\s+/g, '_')}_${format(parseISO(payroll.dateRangeStart), 'yyyy-MM')}.pdf`;
    doc.save(filename);
  } else {
    return doc;
  }
}

export function previewPayslipPDF(
  payroll: Payroll,
  partTimer: PartTimerInfo,
  attendanceRecords?: AttendanceRow[],
  events?: EventInfo[],
  staffSalaries?: StaffSalaryInfo[]
): string {
  const doc = generatePayslipPDF(payroll, partTimer, 'preview', attendanceRecords, events, staffSalaries);
  return doc ? doc.output('dataurlstring') : '';
}
