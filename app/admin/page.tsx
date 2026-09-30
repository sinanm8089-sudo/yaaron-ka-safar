import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/ui/shared';
import { CurrentActivityCard } from '@/components/timeline/timeline';
import { Users, Wallet, TrendingUp, Clock } from 'lucide-react';
import type { Activity } from '@/types';

async function getAdminDashboardData() {
  const supabase = await createClient();

  // Get trip
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .single();

  // Get students count
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  // Get all students with their fees
  const { data: students } = await supabase
    .from('students')
    .select('id, trip_fee');

  // Get all payments
  const { data: payments } = await supabase
    .from('payments')
    .select('student_id, amount');

  // Calculate financial summary
  const totalExpected = students?.reduce((sum, s) => sum + Number(s.trip_fee), 0) ?? 0;
  const totalCollected = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const totalPending = totalExpected - totalCollected;

  // Get current and next activity
  const { data: allActivities } = await supabase
    .from('activities')
    .select('*')
    .order('start_time', { ascending: true });

  const liveActivity = allActivities?.find((a) => a.status === 'live') ?? null;
  const upcomingActivities = allActivities?.filter((a) => a.status === 'upcoming') ?? [];
  const nextActivity = upcomingActivities[0] ?? null;

  // Get current day info
  const { data: currentDay } = await supabase
    .from('trip_days')
    .select('*')
    .eq('trip_date', new Date().toISOString().split('T')[0])
    .single();

  // Get today's activities
  let todayActivities: Activity[] = [];
  if (currentDay) {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_day_id', currentDay.id)
      .order('sort_order', { ascending: true });
    todayActivities = data ?? [];
  }

  // Get recent attendance stats
  const { data: recentSessions } = await supabase
    .from('attendance_sessions')
    .select('id, status, activity_id')
    .order('started_at', { ascending: false })
    .limit(1);

  return {
    trip,
    totalStudents: totalStudents ?? 0,
    totalExpected,
    totalCollected,
    totalPending,
    currentActivity: liveActivity as Activity | null,
    nextActivity: nextActivity as Activity | null,
    currentDay,
    todayActivities: todayActivities as Activity[],
    recentSession: recentSessions?.[0] ?? null,
  };
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {data.trip?.name ?? 'Yaaron Ka Safar'} — Trip Control Center
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 stagger-children">
        <StatCard
          label="Total Students"
          value={data.totalStudents.toString()}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(data.totalCollected)}
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          label="Pending"
          value={formatCurrency(data.totalPending)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          label="Expected"
          value={formatCurrency(data.totalExpected)}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Current Activity */}
      <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <CurrentActivityCard
          activity={data.currentActivity}
          nextActivity={data.nextActivity}
        />
      </div>

      {/* Today's Timeline */}
      {data.currentDay && data.todayActivities.length > 0 && (
        <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-text)]">
                  Today&apos;s Timeline
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Day {data.currentDay.day_number} — {data.currentDay.title}
                </p>
              </div>
            </div>
            <div className="space-y-0">
              {data.todayActivities.map((activity, i) => {
                const isCompleted = activity.status === 'completed';
                const isLive = activity.status === 'live';

                return (
                  <div key={activity.id} className="flex gap-4 pb-5 last:pb-0 relative">
                    {/* Connector line */}
                    {i < data.todayActivities.length - 1 && (
                      <div className="absolute left-[19px] top-10 bottom-0 w-[2px] bg-[var(--color-border)]" />
                    )}
                    {/* Dot */}
                    <div className="relative z-10 flex-shrink-0">
                      {isCompleted && (
                        <div className="w-10 h-10 rounded-full bg-[var(--color-success)] flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {isLive && (
                        <div className="w-10 h-10 rounded-full bg-[var(--color-live)] flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                          <div className="w-3 h-3 rounded-full bg-white" />
                        </div>
                      )}
                      {!isCompleted && !isLive && (
                        <div className="w-10 h-10 rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-text-muted)]" />
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-semibold ${isCompleted ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text)]'}`}>
                          {activity.title}
                        </h4>
                        {activity.start_time && (
                          <span className={`text-xs font-medium ${isLive ? 'text-[var(--color-live)]' : 'text-[var(--color-text-muted)]'}`}>
                            {new Date(activity.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        )}
                      </div>
                      {activity.location && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{activity.location}</p>
                      )}
                      {isLive && (
                        <span className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full bg-[var(--color-danger-bg)] border border-[var(--color-live)]/20 text-[10px] font-bold text-[var(--color-live)] uppercase">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-live)] opacity-75 animate-ping" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-live)]" />
                          </span>
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
