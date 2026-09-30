import { createClient } from '@/lib/supabase/server';
import { formatTime, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/shared';
import { MapPin, Clock, Calendar } from 'lucide-react';
import type { TripDay, Activity } from '@/types';

async function getSchedule() {
  const supabase = await createClient();

  const { data: tripDays } = await supabase
    .from('trip_days')
    .select('*')
    .order('day_number', { ascending: true });

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .order('sort_order', { ascending: true });

  const daysWithActivities = (tripDays ?? []).map((day) => ({
    ...day,
    activities: (activities ?? []).filter((a) => a.trip_day_id === day.id),
  }));

  return daysWithActivities;
}

const statusConfig: Record<string, { variant: 'success' | 'live' | 'default' | 'warning'; label: string }> = {
  completed: { variant: 'success', label: 'Completed' },
  live: { variant: 'live', label: 'Live' },
  upcoming: { variant: 'default', label: 'Upcoming' },
  cancelled: { variant: 'warning', label: 'Cancelled' },
};

export default async function SchedulePage() {
  const days = await getSchedule();

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          Trip Schedule
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Complete itinerary — October 2 to October 6
        </p>
      </div>

      <div className="space-y-6 stagger-children">
        {days.map((day) => {
          const today = new Date().toISOString().split('T')[0];
          const isToday = day.trip_date === today;

          return (
            <Card key={day.id} className={isToday ? 'border-[var(--color-primary)]/30' : ''}>
              <CardHeader>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle>Day {day.day_number}</CardTitle>
                    {isToday && (
                      <Badge variant="primary" size="sm" dot pulse>
                        Today
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(day.trip_date)}
                    </span>
                    <span>{day.title}</span>
                  </div>
                </div>
              </CardHeader>

              {day.activities.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No activities scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {day.activities.map((activity: Activity, i: number) => {
                    const config = statusConfig[activity.status] ?? statusConfig.upcoming;

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        {/* Time */}
                        <div className="w-16 flex-shrink-0 text-right">
                          {activity.start_time ? (
                            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                              {formatTime(activity.start_time)}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--color-text-muted)]">—</span>
                          )}
                        </div>

                        {/* Divider dot */}
                        <div className="mt-1.5 flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.status === 'completed' ? 'bg-[var(--color-success)]' :
                            activity.status === 'live' ? 'bg-[var(--color-live)] animate-pulse' :
                            'bg-[var(--color-text-muted)]'
                          }`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-[var(--color-text)]">
                              {activity.title}
                            </h4>
                            <Badge variant={config.variant} size="sm">
                              {config.label}
                            </Badge>
                          </div>
                          {activity.description && (
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                              {activity.description}
                            </p>
                          )}
                          {activity.location && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-[var(--color-text-muted)]" />
                              <span className="text-xs text-[var(--color-text-muted)]">{activity.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
