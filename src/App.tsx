import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import PartTimers from "./pages/PartTimers";
import Attendance from "./pages/Attendance";
import Payroll from "./pages/Payroll";
import Reports from "./pages/Reports";
import PartTimerLogin from "./pages/PartTimerLogin";
import PartTimerJobs from "./pages/PartTimerJobs";
import PartTimerHistory from "./pages/PartTimerHistory";
import PartTimerPayslips from "./pages/PartTimerPayslips";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Part-timer routes (no MainLayout) */}
          <Route path="/part-timer/login" element={<PartTimerLogin />} />
          <Route path="/part-timer/dashboard" element={<PartTimerJobs />} />
          <Route path="/part-timer/history" element={<PartTimerHistory />} />
          <Route path="/part-timer/payslips" element={<PartTimerPayslips />} />

          {/* Admin routes (with MainLayout) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/part-timers" element={<PartTimers />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
