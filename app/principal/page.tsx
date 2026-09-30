import { createClient } from '@/lib/supabase/server';
import { formatTime, getDayNumber } from '@/lib/utils';
import { CurrentActivityCard } from '@/components/timeline/timeline';
import { Badge } from '@/components/ui/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Check, Circle, Radio, Camera } from 'lucide-react';
import Link from 'next/link';
import type { Activity } from '@/types';

async function getPrincipalDashboard() {
  const supabase = await createClient();

  const { data: trip } = await supabase.from('trips').select('*').single();

  const today = new Date().toISOString().split('T')[0];
  const { data: currentDay } = await supabase
    .from('trip_days')
    .select('*')
    .eq('trip_date', today)
    .single();

  let todayActivities: Activity[] = [];
  if (currentDay) {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_day_id', currentDay.id)
      .order('sort_order', { ascending: true });
    todayActivities = (data ?? []) as Activity[];
  }

  const liveActivity = todayActivities.find((a) => a.status === 'live') ?? null;
  const nextActivity = todayActivities.find((a) => a.status === 'upcoming') ?? null;

  // Recent photos
  const { data: recentPhotos } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(4);

  return { trip, currentDay, todayActivities, liveActivity, nextActivity, recentPhotos: recentPhotos ?? [] };
}

export default async function PrincipalDashboardPage() {
  const data = await getPrincipalDashboard();

  const dayNumber = data.currentDay?.day_number ?? (data.trip ? getDayNumber(data.trip.start_date) : 1);
  const dayTitle = data.currentDay?.title ?? '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-extrabold font-[var(--font-display)] gradient-text">
          YAARON KA SAFAR
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge variant="primary" size="md">Day {dayNumber}</Badge>
          {dayTitle && <span className="text-sm text-[var(--color-text-secondary)]">— {dayTitle}</span>}
        </div>
      </div>

      {/* Current Activity */}
      <CurrentActivityCard
        activity={data.liveActivity}
        nextActivity={data.nextActivity}
      />

      {/* Today's Timeline */}
      {data.todayActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
          </CardHeader>

          <div className="space-y-2">
            {data.todayActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 py-1.5">
                {activity.status === 'completed' ? (
                  <Check className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                ) : activity.status === 'live' ? (
                  <div className="relative">
                    <Radio className="w-4 h-4 text-[var(--color-live)] flex-shrink-0" />
                  </div>
                ) : (
                  <Circle className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                )}
                <span className={`text-sm flex-1 ${activity.status === 'completed' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text)]'}`}>
                  {activity.title}
                </span>
                {activity.start_time && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {formatTime(activity.start_time)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Photos */}
      {data.recentPhotos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Photo Gallery</h2>
            <Link
              href="/principal/photos"
              className="text-xs text-[var(--color-primary)] font-medium hover:underline"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.recentPhotos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-elevated)]"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-[var(--color-text-muted)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
