import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllPartTimers,
  getAllEvents,
  getAllAttendance,
  getAllPayroll,
  getDashboardStats,
  getAllEventDailyAssignments,
  getAllEventStaffSalaries,
  createPartTimer,
  updatePartTimer,
  deletePartTimer,
  createEvent,
  updateEvent,
  deleteEvent,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  createPayroll,
  updatePayroll,
  deletePayroll,
} from '@/db/queries';
import type { NewPartTimer, NewEvent, NewAttendance, NewPayroll } from '@/db/schema';

// Part Timers
export function usePartTimers() {
  return useQuery({
    queryKey: ['partTimers'],
    queryFn: getAllPartTimers,
  });
}

// Events
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: getAllEvents,
  });
}

// Event Daily Assignments
export function useEventDailyAssignments() {
  return useQuery({
    queryKey: ['eventDailyAssignments'],
    queryFn: getAllEventDailyAssignments,
  });
}

// Event Staff Salaries (all, for rate lookups)
export function useEventStaffSalaries() {
  return useQuery({
    queryKey: ['eventStaffSalaries'],
    queryFn: getAllEventStaffSalaries,
  });
}

// Attendance
export function useAttendance() {
  return useQuery({
    queryKey: ['attendance'],
    queryFn: getAllAttendance,
  });
}

// Payroll
export function usePayroll() {
  return useQuery({
    queryKey: ['payroll'],
    queryFn: getAllPayroll,
  });
}

// Dashboard Stats
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });
}

// Part Timer Mutations
export function useCreatePartTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPartTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partTimers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useUpdatePartTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewPartTimer> }) =>
      updatePartTimer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partTimers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useDeletePartTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePartTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partTimers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

// Event Mutations
export function useCreateEvent() {
  return useMutation({
    mutationFn: createEvent,
  });
}

export function useUpdateEvent() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewEvent> }) =>
      updateEvent(id, data),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

// Attendance Mutations
export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewAttendance> }) =>
      updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// Payroll Mutations
export function useCreatePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useUpdatePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewPayroll> }) =>
      updatePayroll(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useDeletePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}
