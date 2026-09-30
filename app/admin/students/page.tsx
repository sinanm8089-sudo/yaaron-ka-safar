import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import { Avatar } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/shared';
import Link from 'next/link';
import { Plus, Upload, Search, ChevronRight } from 'lucide-react';
import type { Student, Payment } from '@/types';
import { DeleteStudentButton } from './delete-student-button';

async function getStudents() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .order('serial_number', { ascending: true });

  const { data: payments } = await supabase
    .from('payments')
    .select('student_id, amount');

  // Merge payment totals
  const paymentMap = new Map<string, number>();
  payments?.forEach((p) => {
    paymentMap.set(p.student_id, (paymentMap.get(p.student_id) ?? 0) + Number(p.amount));
  });

  return (students ?? []).map((s) => ({
    ...s,
    total_paid: paymentMap.get(s.id) ?? 0,
    balance: Number(s.trip_fee) - (paymentMap.get(s.id) ?? 0),
  }));
}

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
            Students
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {students.length} students enrolled
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/import">
            <Button variant="secondary" icon={<Upload className="w-4 h-4" />} size="sm">
              Import Excel
            </Button>
          </Link>
          <Link href="/admin/students/new">
            <Button icon={<Plus className="w-4 h-4" />} size="sm">
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Student List */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        {/* Table Header (desktop) */}
        <div className="hidden lg:grid lg:grid-cols-[40px_1fr_120px_120px_120px_40px_40px] gap-4 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">#</span>
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">Name</span>
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase text-right">Fee</span>
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase text-right">Paid</span>
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase text-right">Balance</span>
          <span></span>
          <span></span>
        </div>

        {/* Student Rows */}
        {students.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[var(--color-text-secondary)]">No students yet.</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Import from Excel or add students manually.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {students.map((student, index) => (
              <Link
                key={student.id}
                href={`/admin/students/${student.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-surface-elevated)] transition-colors lg:grid lg:grid-cols-[40px_1fr_120px_120px_120px_40px_40px]"
              >
                {/* Serial */}
                <span className="text-sm text-[var(--color-text-muted)] hidden lg:block">
                  {student.serial_number ?? index + 1}
                </span>

                {/* Avatar + Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar name={student.full_name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {student.full_name}
                    </p>
                    {student.admission_number && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {student.admission_number}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fee (desktop) */}
                <span className="text-sm text-[var(--color-text-secondary)] text-right hidden lg:block">
                  {formatCurrency(Number(student.trip_fee))}
                </span>

                {/* Paid */}
                <span className="text-sm font-medium text-[var(--color-success)] text-right hidden lg:block">
                  {formatCurrency(student.total_paid)}
                </span>

                {/* Balance */}
                <div className="ml-auto flex items-center gap-2 lg:justify-end">
                  {student.balance > 0 ? (
                    <Badge variant="warning" size="sm">
                      {formatCurrency(student.balance)}
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm">
                      Paid ✓
                    </Badge>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] hidden lg:block" />
                
                {/* Delete Button */}
                <div className="hidden lg:block">
                  <DeleteStudentButton studentId={student.id} studentName={student.full_name} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
