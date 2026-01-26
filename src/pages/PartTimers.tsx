import { useState } from 'react';
import { Plus, Search, MoreVertical, Phone, Building2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockPartTimers } from '@/data/mockData';
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
import { PartTimer } from '@/types';

export default function PartTimers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartTimer, setSelectedPartTimer] = useState<PartTimer | null>(null);

  const filteredPartTimers = mockPartTimers.filter(pt => 
    pt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pt.ic.includes(searchQuery) ||
    pt.contact.includes(searchQuery)
  );

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
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Part-Timer
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
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
                      <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                      <DropdownMenuItem>View Attendance</DropdownMenuItem>
                      <DropdownMenuItem>View Payroll</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

              <Button className="w-full">Edit Profile</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
