import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/shared';
import { Wallet, Banknote, Smartphone, CreditCard } from 'lucide-react';
import type { Payment } from '@/types';

const methodIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-4 h-4" />,
  gpay: <Smartphone className="w-4 h-4" />,
  upi: <CreditCard className="w-4 h-4" />,
  other: <Wallet className="w-4 h-4" />,
};

async function getPaymentData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('profile_id', profile?.id)
    .single();

  if (!student) return null;

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', student.id)
    .order('payment_date', { ascending: false });

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    student,
    payments: payments ?? [],
    totalPaid,
    balance: Number(student.trip_fee) - totalPaid,
  };
}

export default async function StudentPaymentsPage() {
  const data = await getPaymentData();

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-text-secondary)]">Payment data unavailable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          My Trip Payment
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Trip Fee</p>
          <p className="text-lg font-bold text-[var(--color-text)]">
            {formatCurrency(Number(data.student.trip_fee))}
          </p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Paid</p>
          <p className="text-lg font-bold text-[var(--color-success)]">
            {formatCurrency(data.totalPaid)}
          </p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Balance</p>
          <p className={`text-lg font-bold ${data.balance > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
            {data.balance > 0 ? formatCurrency(data.balance) : '✓'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-2">
          <span>Payment Progress</span>
          <span>{Math.min(Math.round((data.totalPaid / Number(data.student.trip_fee)) * 100), 100)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-success)] transition-all duration-500"
            style={{ width: `${Math.min((data.totalPaid / Number(data.student.trip_fee)) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>

        {data.payments.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No payments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {data.payments.map((payment: Payment) => (
              <div
                key={payment.id}
                className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)]"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center text-[var(--color-success)]">
                  {methodIcons[payment.payment_method] ?? <Wallet className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--color-success)]">
                      +{formatCurrency(Number(payment.amount))}
                    </p>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {formatDate(payment.payment_date)}
                    </span>
                  </div>
                  <Badge variant="default" size="sm" className="mt-0.5">
                    {payment.payment_method.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
