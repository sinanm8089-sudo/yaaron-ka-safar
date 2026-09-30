'use client';

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function StudentReportsPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          Student Reports
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          View reports submitted by students.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--color-primary)]" />
            Recent Reports
          </CardTitle>
        </CardHeader>
        <div className="pt-2">
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">No reports available</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Reports will be displayed here once submitted.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
