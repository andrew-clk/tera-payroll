import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePartTimer, useUpdatePartTimer } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { PartTimer } from '@/types';

const partTimerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  ic: z.string().min(1, 'IC number is required'),
  contact: z.string().min(1, 'Contact number is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  bankAccount: z.string().min(1, 'Bank account is required'),
  status: z.enum(['active', 'inactive']).default('active'),
});

type PartTimerFormData = z.infer<typeof partTimerSchema>;

interface PartTimerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partTimer?: PartTimer | null;
}

export function PartTimerDialog({ open, onOpenChange, partTimer }: PartTimerDialogProps) {
  const isEdit = !!partTimer;
  const createMutation = useCreatePartTimer();
  const updateMutation = useUpdatePartTimer();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PartTimerFormData>({
    resolver: zodResolver(partTimerSchema),
    defaultValues: partTimer
      ? {
          name: partTimer.name,
          ic: partTimer.ic,
          contact: partTimer.contact,
          bankName: partTimer.bankName,
          bankAccount: partTimer.bankAccount,
          status: partTimer.status,
        }
      : {
          status: 'active',
        },
  });

  const status = watch('status');

  const onSubmit = async (data: PartTimerFormData) => {
    try {
      // Remove all dashes from IC number
      const cleanedData = {
        ...data,
        ic: data.ic.replace(/-/g, ''),
      };

      if (isEdit && partTimer) {
        await updateMutation.mutateAsync({
          id: partTimer.id,
          data: cleanedData,
        });
        toast.success('Part-timer updated successfully');
      } else {
        await createMutation.mutateAsync({
          id: crypto.randomUUID(),
          ...cleanedData,
        });
        toast.success('Part-timer added successfully');
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(isEdit ? 'Failed to update part-timer' : 'Failed to add part-timer');
      console.error(error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Part-Timer' : 'Add New Part-Timer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" {...register('name')} placeholder="John Doe" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ic">IC/Passport Number *</Label>
            <Input id="ic" {...register('ic')} placeholder="990101011234" />
            {errors.ic && <p className="text-sm text-destructive">{errors.ic.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact Number *</Label>
            <Input id="contact" {...register('contact')} placeholder="012-3456789" />
            {errors.contact && <p className="text-sm text-destructive">{errors.contact.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input id="bankName" {...register('bankName')} placeholder="Maybank" />
              {errors.bankName && <p className="text-sm text-destructive">{errors.bankName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Account Number *</Label>
              <Input id="bankAccount" {...register('bankAccount')} placeholder="123456789" />
              {errors.bankAccount && <p className="text-sm text-destructive">{errors.bankAccount.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Update' : 'Add'} Part-Timer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
