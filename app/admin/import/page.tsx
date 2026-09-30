'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/shared';
import { formatCurrency } from '@/lib/utils';
import { Upload, FileSpreadsheet, AlertTriangle, Check, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface ParsedStudent {
  row: number;
  name: string;
  admission_number?: string;
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
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      if (data.length === 0) {
        setImportError('No data found in the spreadsheet.');
        return;
      }

      // Auto-detect columns by checking keys
      const sampleRow = data[0];
      const keys = Object.keys(sampleRow);

      const findKey = (patterns: string[]) =>
        keys.find((k) =>
          patterns.some((p) => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(p))
        );

      const nameKey = findKey(['name', 'student', 'fullname']) ?? keys[1] ?? keys[0];
      const admissionKey = findKey(['admission', 'admno', 'rollno', 'slno', 'serialno']);
      const classKey = findKey(['class', 'grade', 'section']);
      const totalKey = findKey(['total', 'fee', 'tripamount', 'amount']);
      const paidKey = findKey(['paid', 'received', 'collected', 'advance']);

      const parsed: ParsedStudent[] = data.map((row, index) => {
        const rawName = String(row[nameKey] ?? '').trim();
        const rawAdmission = admissionKey ? String(row[admissionKey] ?? '').trim() : undefined;
        const rawClass = classKey ? String(row[classKey] ?? '').trim() : undefined;
        const rawTotal = totalKey ? Number(row[totalKey]) : 6450;
        const rawPaid = paidKey ? Number(row[paidKey]) : 0;

        const errors: string[] = [];

        if (!rawName) errors.push('Name is required');
        if (isNaN(rawTotal) || rawTotal < 0) errors.push('Invalid total amount');
        if (isNaN(rawPaid) || rawPaid < 0) errors.push('Invalid paid amount');
        if (!isNaN(rawTotal) && !isNaN(rawPaid) && rawPaid > rawTotal) {
          errors.push('Paid amount exceeds total');
        }

        return {
          row: index + 2, // +2 for header row + 0-index
          name: rawName,
          admission_number: rawAdmission || undefined,
          class_name: rawClass || undefined,
          total_amount: isNaN(rawTotal) ? 6450 : rawTotal,
          amount_paid: isNaN(rawPaid) ? 0 : rawPaid,
          errors,
        };
      }).filter((s) => s.name); // Filter empty rows

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
    const supabase = createClient();

    try {
      // Get the trip ID
      const { data: trip } = await supabase.from('trips').select('id').single();
      if (!trip) {
        setImportError('No trip found. Please create a trip first.');
        setStep('preview');
        return;
      }

      let imported = 0;

      for (const student of validStudents) {
        // Check for existing student
        let existingStudent = null;

        if (student.admission_number) {
          const { data } = await supabase
            .from('students')
            .select('id')
            .eq('admission_number', student.admission_number)
            .single();
          existingStudent = data;
        }

        if (!existingStudent) {
          const { data } = await supabase
            .from('students')
            .select('id')
            .eq('full_name', student.name)
            .eq('trip_id', trip.id)
            .single();
          existingStudent = data;
        }

        if (existingStudent) {
          // Update existing
          await supabase
            .from('students')
            .update({
              full_name: student.name,
              admission_number: student.admission_number,
              class_name: student.class_name,
              trip_fee: student.total_amount,
              serial_number: student.row - 1,
            })
            .eq('id', existingStudent.id);

          // Check if initial payment already exists
          if (student.amount_paid > 0) {
            const { data: existingPayments } = await supabase
              .from('payments')
              .select('id')
              .eq('student_id', existingStudent.id);

            if (!existingPayments || existingPayments.length === 0) {
              await supabase.from('payments').insert({
                student_id: existingStudent.id,
                amount: student.amount_paid,
                payment_method: 'cash',
                payment_date: new Date().toISOString().split('T')[0],
                notes: 'Imported from Excel',
              });
            }
          }
        } else {
          // Insert new student
          const { data: newStudent } = await supabase
            .from('students')
            .insert({
              full_name: student.name,
              admission_number: student.admission_number,
              class_name: student.class_name,
              trip_id: trip.id,
              trip_fee: student.total_amount,
              serial_number: student.row - 1,
            })
            .select('id')
            .single();

          // Insert initial payment if paid
          if (newStudent && student.amount_paid > 0) {
            await supabase.from('payments').insert({
              student_id: newStudent.id,
              amount: student.amount_paid,
              payment_method: 'cash',
              payment_date: new Date().toISOString().split('T')[0],
              notes: 'Imported from Excel',
            });
          }
        }

        imported++;
        setImportedCount(imported);
      }

      setStep('done');
    } catch (err) {
      setImportError('Import failed. Please try again.');
      setStep('preview');
    }
  };

  const validCount = students.filter((s) => s.errors.length === 0).length;
  const invalidCount = students.filter((s) => s.errors.length > 0).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-0">
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

          {/* Preview Table */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Name</th>
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
              Import {validCount} Students
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
            Successfully imported {importedCount} students with payment data.
          </p>
          <div className="flex gap-3 justify-center">
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
