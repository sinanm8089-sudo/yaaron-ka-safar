import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatTime, getDayNumber } from '@/lib/utils';
import { CurrentActivityCard } from '@/components/timeline/timeline';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MapPin, Check, Circle, Radio, ClipboardList, FileText } from 'lucide-react';
import type { Activity, TripDay } from '@/types';

async function getStudentDashboard() {
  const supabase = await createClient();

  // Get user profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get student record
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('profile_id', profile?.id)
    .single();

  // Get trip
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .single();

  // Get current day
  const today = new Date().toISOString().split('T')[0];
  const { data: currentDay } = await supabase
    .from('trip_days')
    .select('*')
    .eq('trip_date', today)
    .single();

  // Get today's activities
  let todayActivities: Activity[] = [];
  if (currentDay) {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_day_id', currentDay.id)
      .order('sort_order', { ascending: true });
    todayActivities = (data ?? []) as Activity[];
  }

  // Find current & next activity
  const liveActivity = todayActivities.find((a) => a.status === 'live') ?? null;
  const nextActivity = todayActivities.find((a) => a.status === 'upcoming') ?? null;

  // Get payment info
  let totalPaid = 0;
  if (student) {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('student_id', student.id);
    totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  }

  return {
    profile,
    student,
    trip,
    currentDay,
    todayActivities,
    currentActivity: liveActivity,
    nextActivity,
    totalPaid,
    balance: student ? Number(student.trip_fee) - totalPaid : 0,
  };
}

export default async function StudentDashboardPage() {
  const data = await getStudentDashboard();

  if (!data || !data.trip) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-text-secondary)]">Unable to load dashboard.</p>
      </div>
    );
  }

  const dayNumber = data.currentDay?.day_number ?? getDayNumber(data.trip.start_date);
  const dayTitle = data.currentDay?.title ?? 'Trip';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-2xl font-extrabold font-[var(--font-display)] gradient-text">
          YAARON KA SAFAR
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge variant="primary" size="md">
            Day {dayNumber}
          </Badge>
          <span className="text-sm text-[var(--color-text-secondary)]">{dayTitle}</span>
        </div>
      </div>

      {/* Current Activity */}
      <CurrentActivityCard
        activity={data.currentActivity}
        nextActivity={data.nextActivity}
      />

      {/* Today's Timeline */}
      {data.todayActivities.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
            Today&apos;s Timeline
          </h2>

          <div className="space-y-0 relative">
            {/* Vertical Line */}
            <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-[var(--color-border)]" />

            {data.todayActivities.map((activity) => {
              const isCompleted = activity.status === 'completed';
              const isLive = activity.status === 'live';

              return (
                <div key={activity.id} className="relative flex gap-3 pb-5 last:pb-0">
                  <div className="relative z-10 flex-shrink-0">
                    {isCompleted && (
                      <div className="w-8 h-8 rounded-full bg-[var(--color-success)] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                    {isLive && (
                      <div className="w-8 h-8 rounded-full bg-[var(--color-live)] flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                        <Radio className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {!isCompleted && !isLive && (
                      <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center">
                        <Circle className="w-3 h-3 text-[var(--color-text-muted)]" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${isCompleted ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text)]'}`}>
                        {activity.title}
                      </h4>
                      {activity.start_time && (
                        <span className={`text-xs ${isLive ? 'text-[var(--color-live)] font-semibold' : 'text-[var(--color-text-muted)]'}`}>
                          {formatTime(activity.start_time)}
                        </span>
                      )}
                    </div>
                    {activity.location && (
                      <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {activity.location}
                      </span>
                    )}
                    {isLive && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[var(--color-danger-bg)] border border-[var(--color-live)]/20 text-[10px] font-bold text-[var(--color-live)] uppercase">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-live)] opacity-75 animate-ping" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-live)]" />
                        </span>
                        Live Now
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Payment Info */}
      {data.student && (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Fee</p>
              <p className="text-sm font-bold text-[var(--color-text)]">{formatCurrency(Number(data.student.trip_fee))}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Paid</p>
              <p className="text-sm font-bold text-[var(--color-success)]">{formatCurrency(data.totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Balance</p>
              <p className={`text-sm font-bold ${data.balance > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
                {data.balance > 0 ? formatCurrency(data.balance) : '✓'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/student/attendance-request">
          <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-2 items-center justify-center">
            <ClipboardList className="w-6 h-6 text-[var(--color-primary)]" />
            <span className="text-xs">Attendance Request</span>
          </Button>
        </Link>
        <Link href="/student/report">
          <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-2 items-center justify-center">
            <FileText className="w-6 h-6 text-[var(--color-primary)]" />
            <span className="text-xs">Submit Report</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
