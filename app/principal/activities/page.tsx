import { createClient } from '@/lib/supabase/server';
import { formatTime } from '@/lib/utils';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/shared';
import { Zap, MapPin, CheckCircle2, Radio, Clock } from 'lucide-react';
import type { Activity, TripDay } from '@/types';

async function getActivities() {
  const supabase = await createClient();
  const { data: tripDays } = await supabase.from('trip_days').select('*').order('day_number', { ascending: true });
  const { data: activities } = await supabase.from('activities').select('*').order('sort_order', { ascending: true });
  return (tripDays ?? []).map((day) => ({
    ...day,
    activities: (activities ?? []).filter((a) => a.trip_day_id === day.id),
  }));
}

export default async function PrincipalActivitiesPage() {
  const days = await getActivities();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
        Activities
      </h1>

      {days.map((day) => (
        <Card key={day.id}>
          <CardHeader>
            <CardTitle className="text-sm">Day {day.day_number} — {day.title}</CardTitle>
          </CardHeader>

          <div className="space-y-2">
            {day.activities.map((activity: Activity) => (
              <div
                key={activity.id}
                className={`flex items-center gap-3 p-3 rounded-[var(--radius-lg)] ${
                  activity.status === 'live' ? 'bg-[var(--color-danger-bg)]' : 'bg-[var(--color-surface-elevated)]'
                }`}
              >
                {activity.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] flex-shrink-0" />
                ) : activity.status === 'live' ? (
                  <Radio className="w-5 h-5 text-[var(--color-live)] flex-shrink-0 animate-pulse" />
                ) : (
                  <Clock className="w-5 h-5 text-[var(--color-text-muted)] flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-[var(--color-text)]">{activity.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {activity.start_time && (
                      <span className="text-xs text-[var(--color-text-muted)]">{formatTime(activity.start_time)}</span>
                    )}
                    {activity.location && (
                      <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                        <MapPin className="w-3 h-3" />{activity.location}
                      </span>
                    )}
                  </div>
                </div>

                <Badge
                  variant={activity.status === 'completed' ? 'success' : activity.status === 'live' ? 'live' : 'default'}
                  size="sm"
                  dot={activity.status === 'live'}
                  pulse={activity.status === 'live'}
                >
                  {activity.status === 'completed' ? 'Done' : activity.status === 'live' ? 'Live' : 'Upcoming'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
