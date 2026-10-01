'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Loader2, Save } from 'lucide-react';

type StudentReport = {
  id: string;
  student_id: string;
  title: string;
  body: string;
  status: 'pending' | 'reviewed';
  admin_response: string | null;
  created_at: string;
  studentName: string;
  serialNumber: number | null;
};

export default function StudentReportsPage() {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      setError('Administrator access is required to review reports.');
      setLoading(false);
      return;
    }

    const [reportResult, studentResult] = await Promise.all([
      supabase.from('student_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('students').select('id, full_name, serial_number'),
    ]);

    const queryError = reportResult.error || studentResult.error;
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const studentMap = new Map((studentResult.data ?? []).map((student) => [student.id, student]));
    const reportRows = (reportResult.data ?? []).map((report) => {
      const student = studentMap.get(report.student_id);
      return {
        ...report,
        studentName: student?.full_name ?? 'Unknown student',
        serialNumber: student?.serial_number ?? null,
      };
    }) as StudentReport[];

    setReports(reportRows);
    setResponses((current) => {
      const next = { ...current };
      for (const report of reportRows) {
        if (!(report.id in next)) next[report.id] = report.admin_response ?? '';
      }
      return next;
    });
    setLoading(false);
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const saveResponse = async (report: StudentReport) => {
    setBusyId(report.id);
    setError('');
    setSuccess('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Your session could not be verified. Please sign in again.');
      setBusyId(null);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      setError('Administrator access is required to review reports.');
      setBusyId(null);
      return;
    }

    const response = (responses[report.id] ?? '').trim();
    const { data, error: updateError } = await supabase
      .from('student_reports')
      .update({
        admin_response: response || null,
        status: 'reviewed',
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', report.id)
      .select('id');

    if (updateError || !data?.length) {
      setError(updateError?.message ?? 'The report could not be updated. Refresh the page and try again.');
      setBusyId(null);
      return;
    }

    setSuccess(`Saved response to “${report.title}”.`);
    await fetchData();
    setBusyId(null);
  };

  const visibleReports = reports.filter((report) => filter === 'all' || report.status === 'pending');
  const pendingCount = reports.filter((report) => report.status === 'pending').length;

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" /></div>;
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">Student Reports</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{pendingCount} waiting for review</p>
      </div>

      <div className="inline-flex rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1" role="tablist" aria-label="Student report filter">
        {(['pending', 'all'] as const).map((value) => (
          <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors ${filter === value ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}>
            {value === 'pending' ? 'Pending' : 'All reports'}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>}
      {success && <p role="status" className="text-sm text-[var(--color-success)]">{success}</p>}

      {visibleReports.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">{filter === 'pending' ? 'No reports waiting for review' : 'No reports submitted yet'}</h2>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleReports.map((report) => (
            <Card key={report.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {report.serialNumber ? `#${report.serialNumber} · ` : ''}{report.studentName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">Submitted {new Date(report.created_at).toLocaleString('en-IN')}</p>
                </div>
                <Badge variant={report.status === 'reviewed' ? 'success' : 'warning'} size="sm">{report.status}</Badge>
              </div>

              <h2 className="mt-4 text-base font-semibold text-[var(--color-text)]">{report.title}</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{report.body}</p>
              <label className="mt-4 block space-y-1.5">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">Response to student <span className="font-normal text-[var(--color-text-muted)]">(optional)</span></span>
                <textarea maxLength={5000} rows={3} value={responses[report.id] ?? ''} onChange={(event) => setResponses((current) => ({ ...current, [report.id]: event.target.value }))} className="w-full resize-y rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </label>
              <div className="mt-3 flex justify-end">
                <Button size="sm" icon={<Save className="w-4 h-4" />} loading={busyId === report.id} disabled={busyId !== null} onClick={() => void saveResponse(report)}>
                  {report.status === 'reviewed' ? 'Update response' : 'Mark reviewed'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
