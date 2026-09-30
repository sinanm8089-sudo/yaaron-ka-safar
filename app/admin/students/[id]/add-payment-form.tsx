'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface AddPaymentFormProps {
  studentId: string;
}

export function AddPaymentForm({ studentId }: AddPaymentFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from('payments').insert({
      student_id: studentId,
      amount: numAmount,
      payment_method: method,
      payment_date: date,
      notes: notes || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setAmount('');
    setNotes('');
    setOpen(false);
    setLoading(false);
    router.refresh();
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        icon={<Plus className="w-4 h-4" />}
        onClick={() => setOpen(true)}
        className="w-full"
      >
        Add Payment
      </Button>
    );
  }

  return (
    <Card className="animate-scale-in">
      <CardHeader>
        <CardTitle>Add Payment</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount (₹)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min={0}
            step={1}
            required
          />
          <Select
            label="Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'gpay', label: 'GPay' },
              { value: 'upi', label: 'UPI' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </div>

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <Input
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Advance payment"
        />

        {error && (
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        )}

        <div className="flex gap-2">
          <Button type="submit" loading={loading} className="flex-1">
            Save Payment
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
