import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardCheck,
  DollarSign,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/part-timers', icon: Users, label: 'Part Timers' },
  { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/payroll', icon: DollarSign, label: 'Payroll' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50",
          "lg:translate-x-0",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-6 py-6 border-b border-sidebar-border",
        collapsed && "justify-center px-4"
      )}>
        <img
          src="/teradietlogo.avif"
          alt="Tera Diet Logo"
          className={cn(
            "object-contain",
            collapsed ? "w-10 h-10" : "w-12 h-12"
          )}
        />
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-sidebar-foreground text-lg">Tera Payroll Hub</h1>
            <p className="text-xs text-sidebar-muted">Staff Management</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "sidebar-link",
                isActive && "sidebar-link-active",
                collapsed && "justify-center px-3"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "w-6 h-6")} />
              {!collapsed && <span className="animate-fade-in">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Button - Desktop Only */}
      <div className="hidden lg:block p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed && "px-0"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
    </>
  );
}
