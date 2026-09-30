'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DeleteStudentButton({ studentId, studentName }: { studentId: string, studentName: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent triggering the row link
    if (!confirm(`Are you sure you want to delete ${studentName}? This will also delete all their payments and attendance records.`)) return;
    
    setLoading(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
      
    if (!error) {
      router.refresh();
    } else {
      alert('Failed to delete student: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] h-8 w-8 p-0"
      onClick={handleDelete}
      loading={loading}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
