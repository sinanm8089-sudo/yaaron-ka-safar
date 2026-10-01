'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ClipboardList, Loader2, X } from 'lucide-react';

type RequestStatus = 'pending' | 'approved' | 'rejected';
type AttendanceStatus = 'present' | 'absent' | 'late';

type AttendanceRequest = {
  id: string;
  student_id: string;
  session_id: string;
  requested_status: AttendanceStatus;
  reason: string;
  status: RequestStatus;
  review_note: string | null;
  created_at: string;
};

type DisplayRequest = AttendanceRequest & {
  studentName: string;
  serialNumber: number | null;
  sessionLabel: string;
};

const badgeVariant = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
} as const;

export default function AttendanceRequestsPage() {
  const [requests, setRequests] = useState<DisplayRequest[]>([]);
  const [profileId, setProfileId] = useState('');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      setError('Administrator access is required to review requests.');
      setLoading(false);
      return;
    }
    setProfileId(profile.id);

    const [requestResult, studentResult, sessionResult, activityResult, dayResult] = await Promise.all([
      supabase.from('attendance_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('students').select('id, full_name, serial_number'),
      supabase.from('attendance_sessions').select('id, activity_id'),
      supabase.from('activities').select('id, title, trip_day_id'),
      supabase.from('trip_days').select('id, trip_date'),
    ]);

    const queryError = requestResult.error || studentResult.error || sessionResult.error || activityResult.error || dayResult.error;
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const studentMap = new Map((studentResult.data ?? []).map((student) => [student.id, student]));
    const sessionMap = new Map((sessionResult.data ?? []).map((session) => [session.id, session]));
    const activityMap = new Map((activityResult.data ?? []).map((activity) => [activity.id, activity]));
    const dayMap = new Map((dayResult.data ?? []).map((day) => [day.id, day]));

    setRequests(((requestResult.data ?? []) as AttendanceRequest[]).map((request) => {
      const student = studentMap.get(request.student_id);
      const session = sessionMap.get(request.session_id);
      const activity = session ? activityMap.get(session.activity_id) : null;
      const day = activity ? dayMap.get(activity.trip_day_id) : null;
      const dateLabel = day?.trip_date
        ? new Date(`${day.trip_date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Date unavailable';

      return {
        ...request,
        studentName: student?.full_name ?? 'Unknown student',
        serialNumber: student?.serial_number ?? null,
        sessionLabel: `${activity?.title ?? 'Attendance session'} · ${dateLabel}`,
      };
    }));
    setLoading(false);
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const reviewRequest = async (request: DisplayRequest, decision: Exclude<RequestStatus, 'pending'>) => {
    if (!profileId) return;
    setBusyId(request.id);
    setError('');
    const supabase = createClient();
    const reviewNote = reviewNotes[request.id]?.trim() || null;

    if (decision === 'approved') {
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .upsert({
          session_id: request.session_id,
          student_id: request.student_id,
          status: request.requested_status,
          marked_at: new Date().toISOString(),
        }, { onConflict: 'session_id,student_id' });

      if (attendanceError) {
        setError(attendanceError.message);
        setBusyId(null);
        return;
      }
    }

    const { data, error: reviewError } = await supabase
      .from('attendance_requests')
      .update({
        status: decision,
        review_note: reviewNote,
        reviewed_by: profileId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', request.id)
      .eq('status', 'pending')
      .select('id');

    if (reviewError || !data?.length) {
      setError(reviewError?.message ?? 'This request has already been reviewed. Refresh the list.');
      setBusyId(null);
      return;
    }

    setReviewNotes((current) => ({ ...current, [request.id]: '' }));
    await fetchData();
    setBusyId(null);
  };

  const visibleRequests = requests.filter((request) => filter === 'all' || request.status === 'pending');
  const pendingCount = requests.filter((request) => request.status === 'pending').length;

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" /></div>;
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">Attendance Requests</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{pendingCount} pending for review</p>
      </div>

      <div className="inline-flex rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1" role="tablist" aria-label="Attendance request filter">
        {(['pending', 'all'] as const).map((value) => (
          <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors ${filter === value ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}>
            {value === 'pending' ? 'Pending' : 'All requests'}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>}

      {visibleRequests.length === 0 ? (
        <Card className="text-center py-12">
          <ClipboardList className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">{filter === 'pending' ? 'No pending requests' : 'No requests yet'}</h2>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleRequests.map((request) => (
            <Card key={request.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {request.serialNumber ? `#${request.serialNumber} · ` : ''}{request.studentName}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{request.sessionLabel}</p>
                  <p className="mt-2 text-sm text-[var(--color-text)]">Requested status: <span className="font-semibold">{request.requested_status}</span></p>
                </div>
                <Badge variant={badgeVariant[request.status]} size="sm">{request.status}</Badge>
              </div>

              <p className="mt-4 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{request.reason}</p>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">Submitted {new Date(request.created_at).toLocaleString('en-IN')}</p>
              {request.review_note && <p className="mt-2 text-sm text-[var(--color-text-muted)]">Review note: {request.review_note}</p>}

              {request.status === 'pending' && (
                <div className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">Review note <span className="font-normal text-[var(--color-text-muted)]">(optional)</span></span>
                    <textarea maxLength={1000} rows={2} value={reviewNotes[request.id] ?? ''} onChange={(event) => setReviewNotes((current) => ({ ...current, [request.id]: event.target.value }))} className="w-full resize-y rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" icon={<Check className="w-4 h-4" />} loading={busyId === request.id} disabled={busyId !== null} onClick={() => void reviewRequest(request, 'approved')}>Approve and apply</Button>
                    <Button size="sm" variant="danger" icon={<X className="w-4 h-4" />} loading={busyId === request.id} disabled={busyId !== null} onClick={() => void reviewRequest(request, 'rejected')}>Reject</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
