'use client';

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StudentReportPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          Submit Report
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Submit a report or feedback to the admin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--color-primary)]" />
            New Report
          </CardTitle>
        </CardHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">
            Report submission form will go here.
          </p>
          <Button className="w-full">Submit Report</Button>
        </div>
      </Card>
    </div>
  );
}
