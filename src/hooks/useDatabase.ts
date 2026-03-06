import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllPartTimers,
  getAllEvents,
  getAllAttendance,
  getAllPayroll,
  getDashboardStats,
  createPartTimer,
  updatePartTimer,
  deletePartTimer,
  createEvent,
  updateEvent,
  deleteEvent,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from '@/db/queries';
import type { NewPartTimer, NewEvent, NewAttendance } from '@/db/schema';

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewEvent> }) =>
      updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
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
