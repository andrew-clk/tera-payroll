import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera } from 'lucide-react';

interface PhotoViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clockInPhoto?: string | null;
  clockOutPhoto?: string | null;
  partTimerName: string;
  eventName: string;
}

export function PhotoViewerDialog({
  open,
  onOpenChange,
  clockInPhoto,
  clockOutPhoto,
  partTimerName,
  eventName,
}: PhotoViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendance Photos</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {partTimerName} - {eventName}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Clock In Photo */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4" />
              Clock In Photo
            </h3>
            {clockInPhoto ? (
              <div className="bg-muted rounded-lg overflow-hidden aspect-video">
                <img
                  src={clockInPhoto}
                  alt="Clock In"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="bg-muted rounded-lg aspect-video flex items-center justify-center text-center text-muted-foreground text-sm">
                No photo
              </div>
            )}
          </div>

          {/* Clock Out Photo */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4" />
              Clock Out Photo
            </h3>
            {clockOutPhoto ? (
              <div className="bg-muted rounded-lg overflow-hidden aspect-video">
                <img
                  src={clockOutPhoto}
                  alt="Clock Out"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="bg-muted rounded-lg aspect-video flex items-center justify-center text-center text-muted-foreground text-sm">
                No photo
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
