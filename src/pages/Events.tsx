import { useState } from 'react';
import { List, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventCalendar } from '@/components/events/EventCalendar';
import { EventList } from '@/components/events/EventList';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'calendar';

export default function Events() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Manage and schedule your events</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('calendar')}
            className={cn(
              "gap-2",
              viewMode === 'calendar' && "bg-card shadow-sm"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Calendar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={cn(
              "gap-2",
              viewMode === 'list' && "bg-card shadow-sm"
            )}
          >
            <List className="w-4 h-4" />
            List
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {viewMode === 'calendar' ? <EventCalendar /> : <EventList />}
      </div>
    </div>
  );
}
