import { useState } from 'react';
import { Plus, Search, MoreVertical, Phone, Building2, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePartTimers, useUpdatePartTimer, useDeletePartTimer } from '@/hooks/useDatabase';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PartTimer } from '@/types';
import { PartTimerDialog } from '@/components/part-timers/PartTimerDialog';
import { toast } from 'sonner';

export default function PartTimers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartTimer, setSelectedPartTimer] = useState<PartTimer | null>(null);
  const [editingPartTimer, setEditingPartTimer] = useState<PartTimer | null>(null);
  const [deletingPartTimer, setDeletingPartTimer] = useState<PartTimer | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { data: partTimers, isLoading } = usePartTimers();
  const updateMutation = useUpdatePartTimer();
  const deleteMutation = useDeletePartTimer();

  const filteredPartTimers = (partTimers ?? []).filter(pt =>
    pt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pt.ic.includes(searchQuery) ||
    pt.contact.includes(searchQuery)
  );

  const handleDeactivate = async (partTimer: PartTimer) => {
    try {
      await updateMutation.mutateAsync({
        id: partTimer.id,
        data: { status: 'inactive' },
      });
      toast.success('Part-timer deactivated');
      setDeletingPartTimer(null);
    } catch (error) {
      toast.error('Failed to deactivate part-timer');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Part-timer deleted');
      setDeletingPartTimer(null);
    } catch (error) {
      toast.error('Failed to delete part-timer');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading part-timers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Part-Timers</h1>
        <p className="page-subtitle">Manage your part-time staff database</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, IC, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Part-Timer
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">IC Number</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Bank Details</TableHead>
              <TableHead className="font-semibold text-right">Hourly Rate</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartTimers.map((partTimer, index) => (
              <TableRow
                key={partTimer.id}
                className="cursor-pointer hover:bg-muted/50 animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => setSelectedPartTimer(partTimer)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {partTimer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium">{partTimer.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{partTimer.ic}</TableCell>
                <TableCell className="text-muted-foreground">{partTimer.contact}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="font-medium">{partTimer.bankName}</p>
                    <p className="text-muted-foreground">{partTimer.bankAccount}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  RM {partTimer.defaultRate.toFixed(2)}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "badge-status",
                    partTimer.status === 'active' ? 'badge-active' : 'badge-inactive'
                  )}>
                    {partTimer.status.charAt(0).toUpperCase() + partTimer.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingPartTimer(partTimer)}>Edit Profile</DropdownMenuItem>
                      <DropdownMenuItem>View Attendance</DropdownMenuItem>
                      <DropdownMenuItem>View Payroll</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeletingPartTimer(partTimer)}
                      >
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredPartTimers.map((partTimer, index) => (
          <div
            key={partTimer.id}
            onClick={() => setSelectedPartTimer(partTimer)}
            className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-soft transition-shadow animate-slide-up"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                  {partTimer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{partTimer.name}</h3>
                  <p className="text-sm text-muted-foreground">{partTimer.contact}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingPartTimer(partTimer)}>Edit Profile</DropdownMenuItem>
                  <DropdownMenuItem>View Attendance</DropdownMenuItem>
                  <DropdownMenuItem>View Payroll</DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeletingPartTimer(partTimer)}
                  >
                    Deactivate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">IC Number</span>
                <span className="font-medium">{partTimer.ic}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-medium">{partTimer.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="font-semibold text-primary">RM {partTimer.defaultRate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-muted-foreground">Status</span>
                <span className={cn(
                  "badge-status",
                  partTimer.status === 'active' ? 'badge-active' : 'badge-inactive'
                )}>
                  {partTimer.status.charAt(0).toUpperCase() + partTimer.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedPartTimer} onOpenChange={() => setSelectedPartTimer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Part-Timer Profile</DialogTitle>
          </DialogHeader>
          {selectedPartTimer && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold">
                  {selectedPartTimer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedPartTimer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPartTimer.ic}</p>
                  <span className={cn(
                    "badge-status mt-1",
                    selectedPartTimer.status === 'active' ? 'badge-active' : 'badge-inactive'
                  )}>
                    {selectedPartTimer.status.charAt(0).toUpperCase() + selectedPartTimer.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contact Number</p>
                    <p className="font-medium">{selectedPartTimer.contact}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="font-medium">{selectedPartTimer.bankName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="font-medium">{selectedPartTimer.bankAccount}</p>
                  </div>
                </div>
              </div>

              {/* Rate */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">Default Hourly Rate</p>
                <p className="text-2xl font-bold text-primary">RM {selectedPartTimer.defaultRate.toFixed(2)}/hr</p>
              </div>

              <Button className="w-full" onClick={() => {
                setEditingPartTimer(selectedPartTimer);
                setSelectedPartTimer(null);
              }}>Edit Profile</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <PartTimerDialog
        open={isAddDialogOpen || !!editingPartTimer}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingPartTimer(null);
          }
        }}
        partTimer={editingPartTimer}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPartTimer} onOpenChange={() => setDeletingPartTimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Part-Timer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {deletingPartTimer?.name}? They will be marked as inactive but their records will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPartTimer && handleDeactivate(deletingPartTimer)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
