'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/shared';
import { ClipboardCheck, CheckCircle2, Bell } from 'lucide-react';

export default function StudentAttendancePage() {
  const [activeSession, setActiveSession] = useState<{
    id: string;
    activity_title: string;
    already_marked: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);

  const checkSession = async () => {
    const supabase = createClient();

    // Get current user's student ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', profile?.id)
      .single();

    // Check for active attendance sessions
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('id, activity_id')
      .eq('status', 'active');

    if (sessions && sessions.length > 0 && student) {
      const session = sessions[0];

      // Get activity title
      const { data: activity } = await supabase
        .from('activities')
        .select('title')
        .eq('id', session.activity_id)
        .single();

      // Check if already marked
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', session.id)
        .eq('student_id', student.id)
        .single();

      setActiveSession({
        id: session.id,
        activity_title: activity?.title ?? 'Activity',
        already_marked: !!existing,
      });

      if (existing) setMarked(true);
    } else {
      setActiveSession(null);
      setMarked(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    checkSession();

    // Real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('student-attendance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_sessions' }, () => {
        checkSession();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAttendance = async () => {
    if (!activeSession) return;
    setMarking(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMarking(false); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', profile?.id)
      .single();

    if (!student) { setMarking(false); return; }

    const { error } = await supabase.from('attendance_records').insert({
      session_id: activeSession.id,
      student_id: student.id,
      status: 'present',
    });

    if (!error) {
      setMarked(true);
    }
    setMarking(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 rounded-[var(--radius-xl)] bg-[var(--color-surface)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          Attendance
        </h1>
      </div>

      {activeSession && !marked ? (
        <Card className="border-[var(--color-primary)]/30 animate-scale-in">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary-glow)] flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-[var(--color-primary)]" />
            </div>

            <Badge variant="live" size="md" dot pulse className="mb-3">
              Attendance Open
            </Badge>

            <h2 className="text-xl font-bold text-[var(--color-text)] mb-1">
              {activeSession.activity_title}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Tap below to mark your attendance
            </p>

            <Button
              size="lg"
              onClick={markAttendance}
              loading={marking}
              icon={<ClipboardCheck className="w-5 h-5" />}
              className="w-full max-w-xs mx-auto text-base"
            >
              MARK ATTENDANCE
            </Button>
          </div>
        </Card>
      ) : marked ? (
        <Card className="text-center py-10 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[var(--color-success)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-success)] mb-1">
            Attendance Marked!
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {activeSession?.activity_title ?? 'Activity'}
          </p>
        </Card>
      ) : (
        <Card className="text-center py-10">
          <ClipboardCheck className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[var(--color-text)] mb-1">
            No Active Session
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            You&apos;ll be notified when attendance opens.
          </p>
        </Card>
      )}
    </div>
  );
}
