import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Avatar, Badge } from '@/components/ui/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  GraduationCap,
  Hash,
  Plus,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';
import type { Payment } from '@/types';
import { AddPaymentForm } from './add-payment-form';
import { DeletePaymentButton } from './delete-payment-button';
import { ChangePasswordForm } from './change-password-form';

interface Props {
  params: Promise<{ id: string }>;
}

async function getStudentDetails(id: string) {
  const supabase = await createClient();

  const { data: student, error } = await supabase
    .from('students')
    .select('*, profiles(user_id)')
    .eq('id', id)
    .single();

  if (error || !student) return null;

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', id)
    .order('payment_date', { ascending: false });

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    student,
    payments: payments ?? [],
    totalPaid,
    balance: Number(student.trip_fee) - totalPaid,
  };
}

const paymentMethodIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-4 h-4" />,
  gpay: <Smartphone className="w-4 h-4" />,
  upi: <CreditCard className="w-4 h-4" />,
  other: <Wallet className="w-4 h-4" />,
};

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getStudentDetails(id);

  if (!data) notFound();

  const { student, payments, totalPaid, balance } = data;

  return (
    <div className="space-y-6 pb-20 lg:pb-0 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </Link>

      {/* Profile Header */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center gap-4">
          <Avatar name={student.full_name} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">{student.full_name}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {student.admission_number && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <Hash className="w-3 h-3" />
                  {student.admission_number}
                </span>
              )}
              {student.class_name && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <GraduationCap className="w-3 h-3" />
                  {student.class_name} {student.division}
                </span>
              )}
              {student.phone && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <Phone className="w-3 h-3" />
                  {student.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        {student.profiles?.user_id && (
          <ChangePasswordForm userId={student.profiles.user_id} />
        )}
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Required</p>
          <p className="text-lg font-bold text-[var(--color-text)]">{formatCurrency(Number(student.trip_fee))}</p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Paid</p>
          <p className="text-lg font-bold text-[var(--color-success)]">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Balance</p>
          <p className={`text-lg font-bold ${balance > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
            {balance > 0 ? formatCurrency(balance) : '✓ Cleared'}
          </p>
        </div>
      </div>

      {/* Add Payment Form */}
      <AddPaymentForm studentId={student.id} />

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>

        {payments.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] pb-2">No payments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((payment: Payment) => (
              <div
                key={payment.id}
                className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)]"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center text-[var(--color-success)]">
                  {paymentMethodIcons[payment.payment_method] ?? <Wallet className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--color-success)]">
                      +{formatCurrency(Number(payment.amount))}
                    </p>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {formatDate(payment.payment_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="default" size="sm">
                      {payment.payment_method.toUpperCase()}
                    </Badge>
                    {payment.notes && (
                      <span className="text-xs text-[var(--color-text-muted)] truncate">
                        {payment.notes}
                      </span>
                    )}
                  </div>
                </div>
                <DeletePaymentButton paymentId={payment.id} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
