'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { signIn } from '@/lib/auth/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Phone, Lock, MapPin, Bus } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    const result = await signIn(data);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--color-primary)] opacity-[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--color-accent)] opacity-[0.04] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] opacity-[0.02] rounded-full blur-[150px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo Section */}
        <div className="text-center mb-10">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] mb-6 shadow-lg shadow-orange-500/20">
            <Bus className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-extrabold font-[var(--font-display)] gradient-text mb-2">
            YAARON KA SAFAR
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Goa</span>
            <span className="text-[var(--color-text-muted)]">•</span>
            <span>Dandeli</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">October 2 — October 6</p>
        </div>

        {/* Form Card */}
        <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-elevated)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Welcome back</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Admission Number"
              type="text"
              placeholder="e.g. 3467"
              icon={<Bus className="w-4 h-4" />}
              error={errors.admission_number?.message}
              {...register('admission_number')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <div className="rounded-[var(--radius-lg)] bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 p-3">
                <p className="text-sm text-[var(--color-danger)]">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              size="lg"
            >
              Sign In
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
          Contact admin if you don&apos;t have an account
        </p>
      </div>
    </div>
  );
}
