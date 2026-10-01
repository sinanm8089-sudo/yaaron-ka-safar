'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/shared';
import { formatCurrency } from '@/lib/utils';
import { Upload, FileSpreadsheet, AlertTriangle, Check, ArrowLeft, Loader2, Download } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { importStudentsAction } from './actions';

interface ParsedStudent {
  row: number;
  name: string;
  admission_number: string;
  password?: string;
  class_name?: string;
  total_amount: number;
  amount_paid: number;
  errors: string[];
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const router = useRouter();

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      parseExcel(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcel(selectedFile);
    }
  };

  const parseExcel = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      // Try to find Trip Fund sheet, or use first sheet
      let sheetName = workbook.SheetNames.find(
        (name) => name.toLowerCase().includes('trip') || name.toLowerCase().includes('fund')
      );
      if (!sheetName) sheetName = workbook.SheetNames[0];

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
      const normalize = (value: unknown) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const headerIndex = rows.findIndex((row) => {
        const headers = row.map(normalize);
        return headers.some((header) => ['name', 'student', 'fullname'].some((token) => header.includes(token)))
          && headers.some((header) => ['total', 'fee', 'amount'].some((token) => header.includes(token)))
          && headers.some((header) => ['paid', 'received', 'collected'].some((token) => header.includes(token)));
      });

      if (headerIndex < 0) {
        setImportError('No data found in the spreadsheet.');
        return;
      }

      const headers = rows[headerIndex].map(normalize);
      const findColumn = (patterns: string[]) => headers.findIndex((header) =>
        patterns.some((pattern) => header.includes(pattern))
      );

      const nameColumn = findColumn(['name', 'student', 'fullname']);
      const serialColumn = findColumn(['serial', 'sno', 'slno', 'rollno']);
      const admissionColumn = findColumn(['admission', 'admno']);
      const classColumn = findColumn(['class', 'grade', 'section']);
      const totalColumn = findColumn(['total', 'fee', 'tripamount', 'amount']);
      const paidColumn = findColumn(['paid', 'received', 'collected', 'advance']);

      const parsed: ParsedStudent[] = rows.slice(headerIndex + 1).map((row, index) => {
        const rawName = String(row[nameColumn] ?? '').trim();
        const rawAdmission = admissionColumn >= 0 ? String(row[admissionColumn] ?? '').trim() : '';
        const rawSerial = serialColumn >= 0 ? Number(row[serialColumn]) : index + 1;
        const rawClass = classColumn >= 0 ? String(row[classColumn] ?? '').trim() : undefined;
        const rawTotal = totalColumn >= 0 ? Number(row[totalColumn]) : 6450;
        const rawPaid = paidColumn >= 0 ? Number(row[paidColumn]) : 0;

        const errors: string[] = [];

        if (rawName.toLowerCase() === 'total') return null;
        if (!rawName) errors.push('Name is required');
        if (!Number.isInteger(rawSerial) || rawSerial < 1) errors.push('Invalid serial number');
        if (isNaN(rawTotal) || rawTotal < 0) errors.push('Invalid total amount');
        if (isNaN(rawPaid) || rawPaid < 0) errors.push('Invalid paid amount');
        if (!isNaN(rawTotal) && !isNaN(rawPaid) && rawPaid > rawTotal) {
          errors.push('Paid amount exceeds total');
        }

        const autoAdmission = rawAdmission || `IVS3-${String(rawSerial).padStart(3, '0')}`;

        const student: ParsedStudent = {
          row: rawSerial,
          name: rawName,
          admission_number: autoAdmission,
          password: '12345678',
          class_name: rawClass || undefined,
          total_amount: isNaN(rawTotal) ? 6450 : rawTotal,
          amount_paid: isNaN(rawPaid) ? 0 : rawPaid,
          errors,
        };
        return student;
      }).filter((student): student is ParsedStudent => student !== null && Boolean(student.name));

      setStudents(parsed);
      setStep('preview');
      setImportError(null);
    } catch (err) {
      setImportError('Failed to parse Excel file. Please check the file format.');
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setImportError(null);

    const validStudents = students.filter((s) => s.errors.length === 0);

    try {
      const result = await importStudentsAction(validStudents.map(s => ({
        row: s.row,
        name: s.name,
        admission_number: s.admission_number,
        password: s.password,
        class_name: s.class_name,
        total_amount: s.total_amount,
        amount_paid: s.amount_paid
      })));

      if (result.error) {
        setImportError(result.error);
        setStep('preview');
        return;
      }

      setImportedCount(result.count || 0);
      setStep('done');
    } catch (err) {
      setImportError('Import failed. Please try again.');
      setStep('preview');
    }
  };

  const validCount = students.filter((s) => s.errors.length === 0).length;
  const invalidCount = students.filter((s) => s.errors.length > 0).length;

  const exportCredentials = () => {
    const csvContent = [
      ['Name', 'Admission No (ID)', 'Password'],
      ...students.map(s => [s.name, s.admission_number, s.password])
    ].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'student_credentials.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-0">
      {/* Back */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          Import Students
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Upload your Excel file to import student data
        </p>
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <Card className="animate-fade-in">
          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center py-16 px-8 border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-xl)] hover:border-[var(--color-primary)]/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-glow)] flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-1">
              Drop your Excel file here
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Supports .xlsx and .xls files
            </p>
            <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />}>
              Browse Files
            </Button>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          {importError && (
            <p className="text-sm text-[var(--color-danger)] mt-3">{importError}</p>
          )}
        </Card>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="info" size="md">
              {students.length} rows detected
            </Badge>
            <Badge variant="success" size="md" dot>
              {validCount} valid
            </Badge>
            {invalidCount > 0 && (
              <Badge variant="danger" size="md" dot>
                {invalidCount} with errors
              </Badge>
            )}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--color-text)]">Credential update</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Importing will set every listed student&apos;s password to <span className="font-mono font-semibold">12345678</span> and update their admission-number login. Share this temporary password securely.
            </p>
          </div>

          {/* Preview Table */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Password</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Total</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Paid</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {students.map((student) => (
                    <tr
                      key={student.row}
                      className={student.errors.length > 0 ? 'bg-[var(--color-danger-bg)]' : 'hover:bg-[var(--color-surface-elevated)]'}
                    >
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{student.row}</td>
                      <td className="px-4 py-3 font-medium text-[var(--color-text)]">{student.name || '—'}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] font-mono text-xs">{student.admission_number}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] font-mono text-xs">{student.password}</td>
                      <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                        {formatCurrency(student.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                        {formatCurrency(student.amount_paid)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {student.errors.length > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-danger)]" />
                            <span className="text-xs text-[var(--color-danger)]">{student.errors[0]}</span>
                          </div>
                        ) : (
                          <Check className="w-4 h-4 text-[var(--color-success)] mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => { setStep('upload'); setStudents([]); setFile(null); }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={validCount === 0}
              className="flex-1"
            >
              Sync {validCount} Student Logins
            </Button>
          </div>
        </div>
      )}

      {/* Importing Step */}
      {step === 'importing' && (
        <Card className="text-center py-12 animate-fade-in">
          <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">Importing Students...</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {importedCount} of {validCount} imported
          </p>
          {/* Progress bar */}
          <div className="max-w-xs mx-auto mt-4 h-1.5 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${(importedCount / validCount) * 100}%` }}
            />
          </div>
        </Card>
      )}

      {/* Done Step */}
      {step === 'done' && (
        <Card className="text-center py-12 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-[var(--color-success)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">Import Complete!</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Successfully synced {importedCount} student profiles and login credentials. Password: <span className="font-mono font-semibold">12345678</span>
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={exportCredentials}>
              Download Passwords
            </Button>
            <Button variant="secondary" onClick={() => { setStep('upload'); setStudents([]); setFile(null); setImportedCount(0); }}>
              Import Another
            </Button>
            <Button onClick={() => router.push('/admin/students')}>
              View Students
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
