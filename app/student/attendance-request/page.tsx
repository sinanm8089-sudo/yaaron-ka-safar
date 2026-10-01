'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/shared';
import { ClipboardList, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AttendanceRequest = {
  id: string;
  session_id: string;
  requested_status: 'present' | 'absent' | 'late';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  review_note: string | null;
  created_at: string;
};

type SessionOption = {
  id: string;
  label: string;
};

const statusVariant = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
} as const;

export default function AttendanceRequestPage() {
  const [studentId, setStudentId] = useState('');
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [requestedStatus, setRequestedStatus] = useState<AttendanceRequest['requested_status']>('present');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Your session could not be verified. Please sign in again.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      setError('Your student profile could not be loaded.');
      setLoading(false);
      return;
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (studentError || !student) {
      setError('No student record is linked to your profile. Contact the administrator.');
      setLoading(false);
      return;
    }

    setStudentId(student.id);
    const [sessionResult, activityResult, dayResult, requestResult] = await Promise.all([
      supabase.from('attendance_sessions').select('id, activity_id, started_at, status').order('started_at', { ascending: false }),
      supabase.from('activities').select('id, title, trip_day_id'),
      supabase.from('trip_days').select('id, trip_date, day_number'),
      supabase.from('attendance_requests').select('*').eq('student_id', student.id).order('created_at', { ascending: false }),
    ]);

    const queryError = sessionResult.error || activityResult.error || dayResult.error || requestResult.error;
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const activities = activityResult.data ?? [];
    const days = dayResult.data ?? [];
    const activityMap = new Map(activities.map((activity) => [activity.id, activity]));
    const dayMap = new Map(days.map((day) => [day.id, day]));
    const options = (sessionResult.data ?? []).flatMap((session) => {
      const activity = activityMap.get(session.activity_id);
      if (!activity) return [];
      const day = dayMap.get(activity.trip_day_id);
      const date = day?.trip_date
        ? new Date(`${day.trip_date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : 'Date unavailable';
      return [{ id: session.id, label: `${activity.title} · ${date} · ${session.status}` }];
    });

    setSessions(options);
    setRequests((requestResult.data ?? []) as AttendanceRequest[]);
    setSessionId((current) => current || options[0]?.id || '');
    setLoading(false);
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studentId || !sessionId) return;

    setSubmitting(true);
    setError('');
    setSuccess('');
    const supabase = createClient();
    const { error: insertError } = await supabase.from('attendance_requests').insert({
      student_id: studentId,
      session_id: sessionId,
      requested_status: requestedStatus,
      reason: reason.trim(),
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setReason('');
    setSuccess('Your attendance request was sent to the administrator.');
    await fetchData();
    setSubmitting(false);
  };

  const sessionLabels = new Map(sessions.map((session) => [session.id, session.label]));

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--color-text)]">Attendance Request</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Request a correction for a recorded session.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[var(--color-primary)]" /> New Request
          </CardTitle>
        </CardHeader>
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">No attendance sessions are available yet.</p>
        ) : (
          <form className="space-y-4" onSubmit={submitRequest}>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Session</span>
              <select required value={sessionId} onChange={(event) => setSessionId(event.target.value)} className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                {sessions.map((session) => <option key={session.id} value={session.id}>{session.label}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Correct attendance to</span>
              <select value={requestedStatus} onChange={(event) => setRequestedStatus(event.target.value as AttendanceRequest['requested_status'])} className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Reason</span>
              <textarea required minLength={10} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="w-full resize-y rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Explain what needs correcting" />
            </label>
            {error && <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>}
            {success && <p role="status" className="text-sm text-[var(--color-success)]">{success}</p>}
            <Button type="submit" className="w-full sm:w-auto" loading={submitting} disabled={!studentId || !sessionId}>Submit Request</Button>
          </form>
        )}
        {error && sessions.length === 0 && <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Your Requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">You have not sent an attendance request.</p>
        ) : requests.map((request) => (
          <Card key={request.id} padding="sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text)]">{sessionLabels.get(request.session_id) ?? 'Attendance session'}</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Requested: {request.requested_status}</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{request.reason}</p>
                {request.review_note && <p className="mt-2 text-sm text-[var(--color-text-muted)]">Admin note: {request.review_note}</p>}
              </div>
              <Badge variant={statusVariant[request.status]} size="sm">{request.status}</Badge>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
