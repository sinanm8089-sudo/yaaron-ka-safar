'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/shared';
import { formatTime } from '@/lib/utils';
import {
  Play,
  Square,
  CheckCircle2,
  MapPin,
  Clock,
  Zap,
  Radio,
} from 'lucide-react';
import type { Activity, TripDay } from '@/types';

export default function ActivitiesPage() {
  const [days, setDays] = useState<(TripDay & { activities: Activity[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    const supabase = createClient();

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
      activities: (activities ?? []).filter((a: Activity) => a.trip_day_id === day.id),
    }));

    setDays(daysWithActivities);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Subscribe to activity changes
    const supabase = createClient();
    const channel = supabase
      .channel('activities-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateActivityStatus = async (activityId: string, status: string) => {
    setActionLoading(activityId);
    const supabase = createClient();

    // If setting to live, first set any current live activity to completed
    if (status === 'live') {
      await supabase
        .from('activities')
        .update({ status: 'completed' })
        .eq('status', 'live');
    }

    await supabase
      .from('activities')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', activityId);

    setActionLoading(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-[var(--radius-xl)] bg-[var(--color-surface)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          Activities
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Manage trip activities — start, stop, and complete
        </p>
      </div>

      {days.map((day) => (
        <Card key={day.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--color-primary)]" />
              Day {day.day_number} — {day.title}
            </CardTitle>
          </CardHeader>

          <div className="space-y-2">
            {day.activities.map((activity) => {
              const isLive = activity.status === 'live';
              const isCompleted = activity.status === 'completed';
              const isUpcoming = activity.status === 'upcoming';

              return (
                <div
                  key={activity.id}
                  className={`flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border transition-all ${
                    isLive
                      ? 'bg-[var(--color-danger-bg)] border-[var(--color-live)]/20'
                      : isCompleted
                      ? 'bg-[var(--color-surface-elevated)] border-[var(--color-border)] opacity-60'
                      : 'bg-[var(--color-surface-elevated)] border-[var(--color-border)]'
                  }`}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {isCompleted && (
                      <CheckCircle2 className="w-6 h-6 text-[var(--color-success)]" />
                    )}
                    {isLive && (
                      <div className="relative">
                        <Radio className="w-6 h-6 text-[var(--color-live)]" />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--color-live)] animate-ping" />
                      </div>
                    )}
                    {isUpcoming && (
                      <Clock className="w-6 h-6 text-[var(--color-text-muted)]" />
                    )}
                  </div>

                  {/* Activity Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[var(--color-text)]">
                      {activity.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {activity.start_time && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {formatTime(activity.start_time)}
                        </span>
                      )}
                      {activity.location && (
                        <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                          <MapPin className="w-3 h-3" />
                          {activity.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {isUpcoming && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Play className="w-3.5 h-3.5" />}
                        loading={actionLoading === activity.id}
                        onClick={() => updateActivityStatus(activity.id, 'live')}
                      >
                        Start
                      </Button>
                    )}
                    {isLive && (
                      <Button
                        size="sm"
                        variant="accent"
                        icon={<Square className="w-3.5 h-3.5" />}
                        loading={actionLoading === activity.id}
                        onClick={() => updateActivityStatus(activity.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                    {isCompleted && (
                      <Badge variant="success" size="sm" dot>Done</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
