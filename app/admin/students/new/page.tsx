'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { addStudentAction } from '../actions';

export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await addStudentAction(formData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/admin/students');
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Add New Student</CardTitle>
        </CardHeader>
        <div className="p-5 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-[var(--color-danger-bg)] text-[var(--color-danger)] text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" name="full_name" required placeholder="Student Name" />
              <Input label="Admission Number" name="admission_number" required placeholder="e.g. 12345" />
              <Input label="Phone Number" name="phone" required placeholder="e.g. 9876543210" />
              <Input label="Password" name="password" type="password" required placeholder="Min 6 characters" />
              
              <Input label="Class Name" name="class_name" placeholder="e.g. 10th" />
              <Input label="Division" name="division" placeholder="e.g. A" />
              
              <Input label="Trip Fee (₹)" name="trip_fee" type="number" defaultValue="2500" required />
              <Input label="Bus Number" name="bus_number" placeholder="e.g. Bus 1" />
              
              <div className="sm:col-span-2">
                <Input label="Emergency Contact (Optional)" name="emergency_contact" placeholder="Parent/Guardian Phone" />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Link href="/admin/students">
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button type="submit" loading={loading} icon={<Save className="w-4 h-4" />}>
                Create Student
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
