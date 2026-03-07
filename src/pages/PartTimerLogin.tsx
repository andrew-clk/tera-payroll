import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import { usePartTimers } from '@/hooks/useDatabase';
import { toast } from 'sonner';

const loginSchema = z.object({
  ic: z.string().min(1, 'IC number is required'),
  contact: z.string().min(1, 'Contact number is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function PartTimerLogin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { data: partTimers } = usePartTimers();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    // Remove dashes from IC input to match database format
    const cleanIc = data.ic.replace(/-/g, '');

    // Find part-timer by IC and contact
    const partTimer = (partTimers ?? []).find(
      (pt) => pt.ic === cleanIc && pt.contact === data.contact && pt.status === 'active'
    );

    if (partTimer) {
      // Store part-timer info in localStorage
      localStorage.setItem('partTimerId', partTimer.id);
      localStorage.setItem('partTimerName', partTimer.name);
      toast.success(`Welcome, ${partTimer.name}!`);
      navigate('/part-timer/dashboard');
    } else {
      toast.error('Invalid credentials or inactive account');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Tera Diet</CardTitle>
            <CardDescription className="text-base mt-2">Part-Timer Portal</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ic">IC/Passport Number</Label>
              <Input
                id="ic"
                placeholder="990101011234"
                {...register('ic')}
                disabled={isLoading}
              />
              {errors.ic && <p className="text-sm text-destructive">{errors.ic.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                placeholder="Enter your contact number"
                {...register('contact')}
                disabled={isLoading}
              />
              {errors.contact && <p className="text-sm text-destructive">{errors.contact.message}</p>}
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Login
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center mt-4">
              Use your IC/Passport number and registered contact number to login
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
