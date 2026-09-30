import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import { StatCard, Badge, Avatar } from '@/components/ui/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Wallet, TrendingUp, CircleDollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

async function getFundData() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, trip_fee, serial_number')
    .order('serial_number', { ascending: true });

  const { data: payments } = await supabase
    .from('payments')
    .select('student_id, amount, payment_method, payment_date');

  const paymentMap = new Map<string, number>();
  let totalCollected = 0;
  const methodTotals: Record<string, number> = { cash: 0, gpay: 0, upi: 0, other: 0 };

  payments?.forEach((p) => {
    const amt = Number(p.amount);
    paymentMap.set(p.student_id, (paymentMap.get(p.student_id) ?? 0) + amt);
    totalCollected += amt;
    methodTotals[p.payment_method] = (methodTotals[p.payment_method] ?? 0) + amt;
  });

  const totalExpected = students?.reduce((sum, s) => sum + Number(s.trip_fee), 0) ?? 0;
  const totalPending = totalExpected - totalCollected;
  const fullyPaidCount = students?.filter((s) => (paymentMap.get(s.id) ?? 0) >= Number(s.trip_fee)).length ?? 0;
  const partiallyPaidCount = students?.filter((s) => {
    const paid = paymentMap.get(s.id) ?? 0;
    return paid > 0 && paid < Number(s.trip_fee);
  }).length ?? 0;
  const unpaidCount = students?.filter((s) => (paymentMap.get(s.id) ?? 0) === 0).length ?? 0;

  return {
    students: (students ?? []).map((s) => ({
      ...s,
      total_paid: paymentMap.get(s.id) ?? 0,
      balance: Number(s.trip_fee) - (paymentMap.get(s.id) ?? 0),
    })),
    totalStudents: students?.length ?? 0,
    totalExpected,
    totalCollected,
    totalPending,
    fullyPaidCount,
    partiallyPaidCount,
    unpaidCount,
    methodTotals,
  };
}

export default async function FundsPage() {
  const data = await getFundData();
  const collectionPercentage = data.totalExpected > 0
    ? Math.round((data.totalCollected / data.totalExpected) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          Trip Fund
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Financial overview & collection status
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 stagger-children">
        <StatCard
          label="Total Students"
          value={data.totalStudents.toString()}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Total Expected"
          value={formatCurrency(data.totalExpected)}
          icon={<CircleDollarSign className="w-5 h-5" />}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(data.totalCollected)}
          icon={<ArrowUpRight className="w-5 h-5 text-[var(--color-success)]" />}
        />
        <StatCard
          label="Pending"
          value={formatCurrency(data.totalPending)}
          icon={<ArrowDownRight className="w-5 h-5 text-[var(--color-warning)]" />}
        />
      </div>

      {/* Collection Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Progress</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">{collectionPercentage}% collected</span>
            <span className="text-[var(--color-text-muted)]">
              {formatCurrency(data.totalCollected)} / {formatCurrency(data.totalExpected)}
            </span>
          </div>
          <div className="h-3 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-500"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
              Fully Paid: {data.fullyPaidCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
              Partial: {data.partiallyPaidCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-danger)]" />
              Unpaid: {data.unpaidCount}
            </span>
          </div>
        </div>
      </Card>

      {/* Payment Method Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>By Payment Method</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { method: 'Cash', key: 'cash', color: 'text-emerald-400' },
            { method: 'GPay', key: 'gpay', color: 'text-blue-400' },
            { method: 'UPI', key: 'upi', color: 'text-purple-400' },
            { method: 'Other', key: 'other', color: 'text-gray-400' },
          ].map(({ method, key, color }) => (
            <div key={key} className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-3 text-center">
              <p className="text-xs text-[var(--color-text-muted)] mb-0.5">{method}</p>
              <p className={`text-sm font-bold ${color}`}>
                {formatCurrency(data.methodTotals[key] ?? 0)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Student Payment Status Table */}
      <Card padding="none">
        <div className="px-5 pt-5 pb-3">
          <CardTitle>Student-wise Status</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Student</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Fee</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Paid</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Balance</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {data.students.map((student) => (
                <tr key={student.id} className="hover:bg-[var(--color-surface-elevated)] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={student.full_name} size="sm" />
                      <span className="font-medium text-[var(--color-text)]">{student.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-[var(--color-text-secondary)]">
                    {formatCurrency(Number(student.trip_fee))}
                  </td>
                  <td className="px-5 py-3 text-right text-[var(--color-success)] font-medium">
                    {formatCurrency(student.total_paid)}
                  </td>
                  <td className="px-5 py-3 text-right font-medium">
                    <span className={student.balance > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}>
                      {student.balance > 0 ? formatCurrency(student.balance) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {student.balance <= 0 ? (
                      <Badge variant="success" size="sm">Paid</Badge>
                    ) : student.total_paid > 0 ? (
                      <Badge variant="warning" size="sm">Partial</Badge>
                    ) : (
                      <Badge variant="danger" size="sm">Unpaid</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
