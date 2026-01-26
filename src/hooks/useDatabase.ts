import { useQuery } from '@tanstack/react-query';
import {
  getAllPartTimers,
  getAllEvents,
  getAllAttendance,
  getAllPayroll,
  getDashboardStats,
} from '@/db/queries';

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
