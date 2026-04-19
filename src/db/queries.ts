import type { NewPartTimer, NewEvent, NewEventDailyAssignment, NewEventStaffSalary, NewAttendance, NewPayroll } from './schema';

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// Part Timers
export const getAllPartTimers = () => api('/api/part-timers');
export const getPartTimerById = (id: string) => api(`/api/part-timers?id=${id}`);
export const createPartTimer = (data: NewPartTimer) => api('/api/part-timers', { method: 'POST', body: JSON.stringify(data) });
export const updatePartTimer = (id: string, data: Partial<NewPartTimer>) => api(`/api/part-timers?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePartTimer = (id: string) => api(`/api/part-timers?id=${id}`, { method: 'DELETE' });

// Events
export const getAllEvents = () => api('/api/events');
export const createEvent = (data: NewEvent) => api('/api/events', { method: 'POST', body: JSON.stringify(data) });
export const updateEvent = (id: string, data: Partial<NewEvent>) => api(`/api/events?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEvent = (id: string) => api(`/api/events?id=${id}`, { method: 'DELETE' });

// Event Daily Assignments
export const getAllEventDailyAssignments = () => api('/api/event-daily-assignments');
export const getEventDailyAssignments = (eventId: string) => api(`/api/event-daily-assignments?eventId=${eventId}`);
export const createEventDailyAssignment = (data: NewEventDailyAssignment) => api('/api/event-daily-assignments', { method: 'POST', body: JSON.stringify(data) });
export const updateEventDailyAssignment = (id: string, data: Partial<NewEventDailyAssignment>) => api(`/api/event-daily-assignments?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEventDailyAssignments = (eventId: string) => api(`/api/event-daily-assignments?eventId=${eventId}`, { method: 'DELETE' });

// Event Staff Salaries
export const getEventStaffSalaries = (eventId: string) => api(`/api/event-staff-salaries?eventId=${eventId}`);
export const createEventStaffSalary = (data: NewEventStaffSalary) => api('/api/event-staff-salaries', { method: 'POST', body: JSON.stringify(data) });
export const updateEventStaffSalary = (id: string, data: Partial<NewEventStaffSalary>) => api(`/api/event-staff-salaries?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEventStaffSalaries = (eventId: string) => api(`/api/event-staff-salaries?eventId=${eventId}`, { method: 'DELETE' });

// Attendance
export const getAllAttendance = () => api('/api/attendance');
export const getAttendanceById = (id: string) => api(`/api/attendance?id=${id}`);
export const getAttendanceByPartTimer = (partTimerId: string) => api(`/api/attendance?partTimerId=${partTimerId}`);
export const getAttendanceByEvent = (eventId: string) => api(`/api/attendance?eventId=${eventId}`);
export const getAttendanceByPartTimerAndEvent = (partTimerId: string, eventId: string) => api(`/api/attendance?partTimerId=${partTimerId}&eventId=${eventId}`);
export const createAttendance = (data: NewAttendance) => api('/api/attendance', { method: 'POST', body: JSON.stringify(data) });
export const updateAttendance = (id: string, data: Partial<NewAttendance>) => api(`/api/attendance?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAttendance = (id: string) => api(`/api/attendance?id=${id}`, { method: 'DELETE' });

// Payroll
export const getAllPayroll = () => api('/api/payroll');
export const getPayrollById = (id: string) => api(`/api/payroll?id=${id}`);
export const getPayrollByPartTimer = (partTimerId: string) => api(`/api/payroll?partTimerId=${partTimerId}`);
export const createPayroll = (data: NewPayroll) => api('/api/payroll', { method: 'POST', body: JSON.stringify(data) });
export const updatePayroll = (id: string, data: Partial<NewPayroll>) => api(`/api/payroll?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePayroll = (id: string) => api(`/api/payroll?id=${id}`, { method: 'DELETE' });

// Dashboard Stats
export const getDashboardStats = () => api('/api/dashboard-stats');
