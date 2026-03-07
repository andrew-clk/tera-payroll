import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, RotateCcw } from 'lucide-react';
import { createAttendance, updateAttendance } from '@/db/queries';
import { uploadImage, generateAttendancePhotoFilename } from '@/lib/imageStorage';
import { toast } from 'sonner';

interface JobAssignment {
  eventId: string;
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendance?: any;
}

interface ClockInOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobAssignment;
  partTimerId: string;
  actionType: 'clockIn' | 'clockOut';
  onSuccess: () => void;
}

export function ClockInOutDialog({
  open,
  onOpenChange,
  job,
  partTimerId,
  actionType,
  onSuccess,
}: ClockInOutDialogProps) {
  const [photo, setPhoto] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setPhoto(imageData);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setPhoto('');
    startCamera();
  };

  const handleSubmit = async () => {
    if (!photo) {
      toast.error('Please take a photo');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();

      // Upload photo to Vercel Blob
      const filename = generateAttendancePhotoFilename(
        partTimerId,
        job.eventId,
        job.date,
        actionType === 'clockIn' ? 'clock-in' : 'clock-out'
      );

      const photoUrl = await uploadImage(photo, filename);

      if (actionType === 'clockIn') {
        // Create new attendance record
        await createAttendance({
          id: crypto.randomUUID(),
          partTimerId,
          eventId: job.eventId,
          date: job.date,
          clockIn: now.toISOString(),
          clockInPhoto: photoUrl,
          status: 'clocked-in',
        });
        toast.success('Clocked in successfully!');
      } else {
        // Update existing attendance record with clock out
        if (!job.attendance) {
          toast.error('No clock-in record found');
          return;
        }

        const clockIn = new Date(job.attendance.clockIn);
        const hoursWorked = ((now.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(2);

        await updateAttendance(job.attendance.id, {
          clockOut: now.toISOString(),
          clockOutPhoto: photoUrl,
          hoursWorked,
          status: 'completed',
        });
        toast.success(`Clocked out successfully! You worked ${hoursWorked} hours.`);
      }

      stopCamera();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setPhoto('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {actionType === 'clockIn' ? 'Clock In' : 'Clock Out'} - {job.eventName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Take a photo to {actionType === 'clockIn' ? 'clock in' : 'clock out'}
          </div>

          <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
            {!photo && !isCameraActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button onClick={startCamera} className="gap-2">
                  <Camera className="w-4 h-4" />
                  Start Camera
                </Button>
              </div>
            )}

            {isCameraActive && !photo && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button onClick={capturePhoto} size="lg" className="rounded-full w-16 h-16">
                    <Camera className="w-6 h-6" />
                  </Button>
                </div>
              </>
            )}

            {photo && (
              <>
                <img src={photo} alt="Captured" className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button onClick={retakePhoto} variant="outline" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Retake Photo
                  </Button>
                </div>
              </>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="text-xs text-center text-muted-foreground">
            Current time: {new Date().toLocaleTimeString()}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!photo || isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {actionType === 'clockIn' ? 'Clock In' : 'Clock Out'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
