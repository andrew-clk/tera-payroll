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
  Leaf
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
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
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-6 py-6 border-b border-sidebar-border",
        collapsed && "justify-center px-4"
      )}>
        <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
          <Leaf className="w-6 h-6 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-sidebar-foreground text-lg">Tera Diet</h1>
            <p className="text-xs text-sidebar-muted">Payroll System</p>
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

      {/* Collapse Button */}
      <div className="p-4 border-t border-sidebar-border">
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
  );
}
