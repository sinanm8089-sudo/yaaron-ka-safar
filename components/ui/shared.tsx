import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'live' | 'accent';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  pulse = false,
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
    primary: 'bg-[var(--color-primary-glow)] text-[var(--color-primary-light)] border-[var(--color-primary)]/20',
    success: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]/20',
    warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]/20',
    danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger)]/20',
    info: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-info)]/20',
    live: 'bg-[var(--color-danger-bg)] text-[var(--color-live)] border-[var(--color-live)]/20',
    accent: 'bg-[var(--color-accent-glow)] text-[var(--color-accent-light)] border-[var(--color-accent)]/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const dotColors: Record<string, string> = {
    default: 'bg-[var(--color-text-muted)]',
    primary: 'bg-[var(--color-primary)]',
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger)]',
    info: 'bg-[var(--color-info)]',
    live: 'bg-[var(--color-live)]',
    accent: 'bg-[var(--color-accent)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-[var(--radius-full)] border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                dotColors[variant]
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              dotColors[variant]
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shine',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">{label}</p>
          <p className="text-2xl font-bold text-[var(--color-text)] font-[var(--font-display)]">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                'text-xs mt-1 font-medium',
                trend.positive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
              )}
            >
              {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="p-4 rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] animate-pulse',
        className
      )}
    />
  );
}

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  const initials = name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover border-2 border-[var(--color-border)]',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white',
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
