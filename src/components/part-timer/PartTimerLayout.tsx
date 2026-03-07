import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Briefcase, History, FileText, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PartTimerLayoutProps {
  children: ReactNode;
  partTimerName: string;
}

export function PartTimerLayout({ children, partTimerName }: PartTimerLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('partTimerId');
    localStorage.removeItem('partTimerName');
    toast.success('Logged out successfully');
    navigate('/part-timer/login');
  };

  const navItems = [
    { path: '/part-timer/dashboard', label: 'My Jobs', icon: Briefcase },
    { path: '/part-timer/history', label: 'Job History', icon: History },
    { path: '/part-timer/payslips', label: 'Payslips', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Tera Diet</h1>
              <p className="text-sm text-muted-foreground">Welcome, {partTimerName}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm" className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
