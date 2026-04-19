import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, RotateCcw, Upload } from 'lucide-react';
import { createAttendance, updateAttendance } from '@/db/queries';
import { uploadImage, generateAttendancePhotoFilename } from '@/lib/imageStorage';
import { roundToNearestHalfHour } from '@/lib/utils';
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
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [useFileInput, setUseFileInput] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image to reduce upload size
  const compressImage = (base64: string, maxWidth = 1024, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Resize if larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = reject;
      img.src = base64;
    });
  };

  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        toast.error('Camera permission denied. Please enable camera access.');
      } else {
        toast.error('Camera not available. Please use upload option.');
      }

      setUseFileInput(true);
      setIsCameraActive(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          // Compress image before setting
          const compressed = await compressImage(base64);
          setPhoto(compressed);
        } catch (error) {
          console.error('Compression error:', error);
          toast.error('Failed to process image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.7);

        try {
          // Compress the captured image
          const compressed = await compressImage(imageData);
          setPhoto(compressed);
        } catch (error) {
          console.error('Compression error:', error);
          // Fallback to uncompressed if compression fails
          setPhoto(imageData);
        }

        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setPhoto('');
    if (useFileInput) {
      triggerFileInput();
    } else {
      startCamera();
    }
  };

  // Cleanup on unmount and when dialog closes
  useEffect(() => {
    if (!open) {
      stopCamera();
      setPhoto('');
      setUseFileInput(false);
      setIsCameraActive(false);
    }
    return () => {
      stopCamera();
    };
  }, [open]);

  const handleSubmit = async () => {
    if (!photo) {
      toast.error('Please take a photo');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('Preparing image...');

    try {
      const now = new Date();

      console.log('Starting submission...', { partTimerId, eventId: job.eventId, actionType });

      // Upload photo to Vercel Blob
      const filename = generateAttendancePhotoFilename(
        partTimerId,
        job.eventId,
        job.date,
        actionType === 'clockIn' ? 'clock-in' : 'clock-out'
      );

      console.log('Uploading photo with filename:', filename);

      let photoUrl: string;
      try {
        setUploadProgress('Uploading photo...');
        photoUrl = await uploadImage(photo, filename);
        console.log('Photo uploaded successfully:', photoUrl);
        setUploadProgress('Saving record...');
      } catch (uploadError) {
        console.error('Photo upload failed:', uploadError);
        toast.error('Failed to upload photo. Please check your internet connection.');
        setIsSubmitting(false);
        setUploadProgress('');
        return;
      }

      if (actionType === 'clockIn') {
        // Create new attendance record
        console.log('Creating attendance record...');
        await createAttendance({
          id: crypto.randomUUID(),
          partTimerId,
          eventId: job.eventId,
          date: job.date,
          clockIn: now,
          clockInPhoto: photoUrl,
          status: 'clocked-in',
        });
        toast.success('Clocked in successfully!');
      } else {
        // Update existing attendance record with clock out
        if (!job.attendance) {
          toast.error('No clock-in record found');
          setIsSubmitting(false);
          return;
        }

        console.log('Updating attendance record...');
        const clockIn = new Date(job.attendance.clockIn);
        const rawHours = (now.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
        const hoursWorked = roundToNearestHalfHour(rawHours).toFixed(2);

        await updateAttendance(job.attendance.id, {
          clockOut: now,
          clockOutPhoto: photoUrl,
          hoursWorked,
          status: 'completed',
        });
        toast.success(`Clocked out successfully! You worked ${hoursWorked} hours.`);
      }

      console.log('Submission completed successfully');
      stopCamera();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to submit: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleClose = () => {
    stopCamera();
    setPhoto('');
    setUseFileInput(false);
    setIsCameraActive(false);
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
                <Button onClick={triggerFileInput} className="gap-2">
                  <Camera className="w-4 h-4" />
                  Take Photo
                </Button>
              </div>
            )}

            {isCameraActive && !photo && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  webkit-playsinline="true"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          <div className="text-xs text-center text-muted-foreground">
            Current time: {new Date().toLocaleTimeString()}
          </div>

          {/* Upload Progress */}
          {isSubmitting && uploadProgress && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">{uploadProgress}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Please wait...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!photo || isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSubmitting ? uploadProgress || 'Processing...' : actionType === 'clockIn' ? 'Clock In' : 'Clock Out'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
