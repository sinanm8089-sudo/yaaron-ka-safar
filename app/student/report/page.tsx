'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/shared';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type StudentReport = {
  id: string;
  title: string;
  body: string;
  status: 'pending' | 'reviewed';
  admin_response: string | null;
  created_at: string;
};

export default function StudentReportPage() {
  const [studentId, setStudentId] = useState('');
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
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
    const { data, error: reportsError } = await supabase
      .from('student_reports')
      .select('id, title, body, status, admin_response, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    if (reportsError) {
      setError(reportsError.message);
      setLoading(false);
      return;
    }

    setReports((data ?? []) as StudentReport[]);
    setLoading(false);
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const submitReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studentId) return;

    setSubmitting(true);
    setError('');
    setSuccess('');
    const supabase = createClient();
    const { error: insertError } = await supabase.from('student_reports').insert({
      student_id: studentId,
      title: title.trim(),
      body: body.trim(),
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setTitle('');
    setBody('');
    setSuccess('Your report was sent to the administrator.');
    await fetchData();
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--color-text)]">Submit Report</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Send a report or feedback to the administrator.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--color-primary)]" /> New Report
          </CardTitle>
        </CardHeader>
        <form className="space-y-4" onSubmit={submitReport}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Subject</span>
            <input required minLength={3} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="What is this report about?" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Details</span>
            <textarea required minLength={10} maxLength={5000} value={body} onChange={(event) => setBody(event.target.value)} rows={5} className="w-full resize-y rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Include the details the administrator needs" />
          </label>
          {error && <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>}
          {success && <p role="status" className="text-sm text-[var(--color-success)]">{success}</p>}
          <Button type="submit" className="w-full sm:w-auto" loading={submitting} disabled={!studentId}>Submit Report</Button>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Your Reports</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">You have not submitted a report.</p>
        ) : reports.map((report) => (
          <Card key={report.id} padding="sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">{report.title}</h3>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{new Date(report.created_at).toLocaleDateString('en-IN')}</p>
                <p className="mt-3 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{report.body}</p>
                {report.admin_response && (
                  <div className="mt-3 border-l-2 border-[var(--color-primary)] pl-3">
                    <p className="text-xs font-semibold text-[var(--color-text)]">Administrator response</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{report.admin_response}</p>
                  </div>
                )}
              </div>
              <Badge variant={report.status === 'reviewed' ? 'success' : 'warning'} size="sm">{report.status}</Badge>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
