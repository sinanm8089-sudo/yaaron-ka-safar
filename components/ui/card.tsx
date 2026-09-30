import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
  gradient?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export function Card({
  children,
  className,
  glass = false,
  hover = false,
  gradient = false,
  padding = 'md',
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] border border-[var(--color-border)]',
        glass ? 'glass' : 'bg-[var(--color-surface)]',
        hover && 'transition-all duration-200 hover:border-[var(--color-text-muted)] hover:shadow-[var(--shadow-elevated)] cursor-pointer',
        gradient && 'gradient-border',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-[var(--color-text)]', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-[var(--color-text-secondary)] mt-0.5', className)}>
      {children}
    </p>
  );
}
