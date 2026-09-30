import { createClient } from '@/lib/supabase/server';
import { formatTime, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/shared';
import { Calendar, Check, Circle, Radio } from 'lucide-react';
import type { Activity } from '@/types';

async function getSchedule() {
  const supabase = await createClient();
  const { data: tripDays } = await supabase.from('trip_days').select('*').order('day_number', { ascending: true });
  const { data: activities } = await supabase.from('activities').select('*').order('sort_order', { ascending: true });
  return (tripDays ?? []).map((day) => ({
    ...day,
    activities: (activities ?? []).filter((a) => a.trip_day_id === day.id),
  }));
}

export default async function PrincipalSchedulePage() {
  const days = await getSchedule();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
        Trip Schedule
      </h1>

      <div className="space-y-4 stagger-children">
        {days.map((day) => {
          const isToday = day.trip_date === today;
          return (
            <Card key={day.id} className={isToday ? 'border-[var(--color-primary)]/30' : ''}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-[var(--color-text)]">Day {day.day_number}</span>
                {isToday && <Badge variant="primary" size="sm" dot pulse>Today</Badge>}
                <span className="text-xs text-[var(--color-text-muted)]">{formatDate(day.trip_date)}</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">{day.title}</p>
              <div className="space-y-2">
                {day.activities.map((activity: Activity) => (
                  <div key={activity.id} className="flex items-center gap-3 py-1.5">
                    {activity.status === 'completed' ? (
                      <Check className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    ) : activity.status === 'live' ? (
                      <Radio className="w-4 h-4 text-[var(--color-live)] flex-shrink-0 animate-pulse" />
                    ) : (
                      <Circle className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                    )}
                    <span className={`text-sm flex-1 ${activity.status === 'completed' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text)]'}`}>
                      {activity.title}
                    </span>
                    {activity.start_time && (
                      <span className="text-xs text-[var(--color-text-muted)]">{formatTime(activity.start_time)}</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
