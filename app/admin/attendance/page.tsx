'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Avatar } from '@/components/ui/shared';
import {
  ClipboardCheck,
  Play,
  Lock,
  Users,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import type { Activity, AttendanceSession, Student } from '@/types';

interface SessionWithData extends AttendanceSession {
  activity: Activity;
  present_ids: Set<string>;
}

export default function AttendancePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sessions, setSessions] = useState<SessionWithData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    const supabase = createClient();

    const { data: acts } = await supabase
      .from('activities')
      .select('*')
      .in('status', ['live', 'completed'])
      .order('start_time', { ascending: false });

    const { data: allSessions } = await supabase
      .from('attendance_sessions')
      .select('*')
      .order('started_at', { ascending: false });

    const { data: allRecords } = await supabase
      .from('attendance_records')
      .select('*');

    const { data: allStudents } = await supabase
      .from('students')
      .select('*')
      .order('serial_number', { ascending: true });

    // Build session data with present student IDs
    const sessionsWithData: SessionWithData[] = (allSessions ?? []).map((session) => {
      const activity = (acts ?? []).find((a) => a.id === session.activity_id);
      const records = (allRecords ?? []).filter((r) => r.session_id === session.id);
      return {
        ...session,
        activity: activity ?? { id: '', title: 'Unknown', trip_day_id: '', sort_order: 0, status: 'upcoming', created_at: '', updated_at: '' } as Activity,
        present_ids: new Set(records.map((r) => r.student_id)),
      };
    });

    setActivities(acts ?? []);
    setSessions(sessionsWithData);
    setStudents(allStudents ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const supabase = createClient();
    const channel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_sessions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const startSession = async (activityId: string) => {
    setActionLoading(activityId);
    const supabase = createClient();

    await supabase.from('attendance_sessions').insert({
      activity_id: activityId,
      status: 'active',
    });

    setActionLoading(null);
    fetchData();
  };

  const closeSession = async (sessionId: string) => {
    setActionLoading(sessionId);
    const supabase = createClient();

    await supabase
      .from('attendance_sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', sessionId);

    setActionLoading(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[var(--radius-xl)] bg-[var(--color-surface)] animate-pulse" />
        ))}
      </div>
    );
  }

  // Activities that can have attendance started
  const liveActivities = activities.filter(
    (a) => a.status === 'live' && !sessions.some((s) => s.activity_id === a.id && s.status === 'active')
  );

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const closedSessions = sessions.filter((s) => s.status === 'closed');

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          Attendance
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Start attendance sessions and monitor in real-time
        </p>
      </div>

      {/* Start Attendance for Live Activities */}
      {liveActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-4 h-4 text-[var(--color-primary)]" />
              Start Attendance
            </CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {liveActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)]"
              >
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text)]">{activity.title}</h4>
                  <Badge variant="live" size="sm" dot pulse>Live</Badge>
                </div>
                <Button
                  size="sm"
                  icon={<ClipboardCheck className="w-4 h-4" />}
                  loading={actionLoading === activity.id}
                  onClick={() => startSession(activity.id)}
                >
                  Start Attendance
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Sessions */}
      {activeSessions.map((session) => (
        <Card key={session.id} className="border-[var(--color-primary)]/20">
          <CardHeader
            action={
              <Button
                size="sm"
                variant="danger"
                icon={<Lock className="w-3.5 h-3.5" />}
                loading={actionLoading === session.id}
                onClick={() => closeSession(session.id)}
              >
                Close
              </Button>
            }
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle>{session.activity?.title ?? 'Activity'}</CardTitle>
                <Badge variant="success" size="sm" dot pulse>
                  Active
                </Badge>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                {session.present_ids.size} / {students.length} present
              </p>
            </div>
          </CardHeader>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-success)] transition-all duration-500"
                style={{ width: `${students.length > 0 ? (session.present_ids.size / students.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Student Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {students.map((student) => {
              const isPresent = session.present_ids.has(student.id);
              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 p-2.5 rounded-[var(--radius-lg)] transition-colors ${
                    isPresent
                      ? 'bg-[var(--color-success-bg)] border border-[var(--color-success)]/20'
                      : 'bg-[var(--color-surface-elevated)]'
                  }`}
                >
                  {isPresent ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-[var(--color-text-muted)] flex-shrink-0" />
                  )}
                  <span className={`text-sm truncate ${isPresent ? 'text-[var(--color-text)] font-medium' : 'text-[var(--color-text-secondary)]'}`}>
                    {student.full_name}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      {/* Closed Sessions History */}
      {closedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Sessions</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {closedSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)]"
              >
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text)]">
                    {session.activity?.title ?? 'Activity'}
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {session.present_ids.size} / {students.length} attended
                  </p>
                </div>
                <Badge variant="default" size="sm">
                  <Lock className="w-3 h-3 mr-1" />
                  Closed
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {liveActivities.length === 0 && activeSessions.length === 0 && closedSessions.length === 0 && (
        <Card className="text-center py-12">
          <ClipboardCheck className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">No Attendance Sessions</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Start an activity first, then you can open attendance.
          </p>
        </Card>
      )}
    </div>
  );
}
