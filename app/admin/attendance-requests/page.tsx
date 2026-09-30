'use client';

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function AttendanceRequestsPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          Attendance Requests
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          View and manage attendance requests from students.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[var(--color-primary)]" />
            Pending Requests
          </CardTitle>
        </CardHeader>
        <div className="pt-2">
          <div className="text-center py-12">
            <ClipboardList className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">No pending requests</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              When students submit attendance requests, they will appear here.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
