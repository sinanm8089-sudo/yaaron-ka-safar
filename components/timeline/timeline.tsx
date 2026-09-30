'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/utils';
import { Check, Circle, Radio, MapPin } from 'lucide-react';
import type { Activity } from '@/types';

interface TimelineProps {
  activities: Activity[];
  className?: string;
  compact?: boolean;
}

export function Timeline({ activities, className, compact = false }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[var(--color-border)]" />

      <div className="space-y-0">
        {activities.map((activity, index) => (
          <TimelineItem
            key={activity.id}
            activity={activity}
            isLast={index === activities.length - 1}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

interface TimelineItemProps {
  activity: Activity;
  isLast: boolean;
  compact: boolean;
}

function TimelineItem({ activity, isLast, compact }: TimelineItemProps) {
  const isCompleted = activity.status === 'completed';
  const isLive = activity.status === 'live';
  const isUpcoming = activity.status === 'upcoming';

  return (
    <div className={cn('relative flex gap-4 pb-6', isLast && 'pb-0')}>
      {/* Icon */}
      <div className="relative z-10 flex-shrink-0 mt-0.5">
        {isCompleted && (
          <div className="w-10 h-10 rounded-full bg-[var(--color-success)] flex items-center justify-center shadow-md">
            <Check className="w-5 h-5 text-white" strokeWidth={3} />
          </div>
        )}
        {isLive && (
          <div className="w-10 h-10 rounded-full bg-[var(--color-live)] flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
            <Radio className="w-5 h-5 text-white" />
          </div>
        )}
        {isUpcoming && (
          <div className="w-10 h-10 rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center">
            <Circle className="w-4 h-4 text-[var(--color-text-muted)]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0', !compact && 'pt-1')}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4
              className={cn(
                'font-semibold text-sm',
                isCompleted && 'text-[var(--color-text-secondary)] line-through decoration-[var(--color-text-muted)]',
                isLive && 'text-[var(--color-text)]',
                isUpcoming && 'text-[var(--color-text-secondary)]'
              )}
            >
              {activity.title}
            </h4>
            {!compact && activity.description && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                {activity.description}
              </p>
            )}
          </div>

          {activity.start_time && (
            <span
              className={cn(
                'text-xs font-medium whitespace-nowrap',
                isLive ? 'text-[var(--color-live)]' : 'text-[var(--color-text-muted)]'
              )}
            >
              {formatTime(activity.start_time)}
            </span>
          )}
        </div>

        {!compact && activity.location && (
          <div className="flex items-center gap-1 mt-1.5">
            <MapPin className="w-3 h-3 text-[var(--color-text-muted)]" />
            <span className="text-xs text-[var(--color-text-muted)]">{activity.location}</span>
          </div>
        )}

        {isLive && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-danger-bg)] border border-[var(--color-live)]/20">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-live)] opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-live)]" />
            </span>
            <span className="text-xs font-semibold text-[var(--color-live)]">LIVE NOW</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface CurrentActivityCardProps {
  activity: Activity | null;
  nextActivity?: Activity | null;
  className?: string;
}

export function CurrentActivityCard({ activity, nextActivity, className }: CurrentActivityCardProps) {
  if (!activity) {
    return (
      <div className={cn('rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5', className)}>
        <p className="text-sm text-[var(--color-text-secondary)]">No active activity right now.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Current Activity */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-live)]/20 bg-gradient-to-br from-[var(--color-danger-bg)] to-[var(--color-surface)] p-5 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-live)] opacity-[0.03] rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Current Activity</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--color-danger-bg)] border border-[var(--color-live)]/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-live)] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-live)]" />
              </span>
              <span className="text-[10px] font-bold text-[var(--color-live)] uppercase">Live</span>
            </span>
          </div>

          <h3 className="text-xl font-bold text-[var(--color-text)] font-[var(--font-display)]">
            {activity.title}
          </h3>

          {activity.location && (
            <div className="flex items-center gap-1.5 mt-2">
              <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">{activity.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Next Event */}
      {nextActivity && (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Next Event</span>
              <h4 className="text-sm font-semibold text-[var(--color-text)] mt-1">{nextActivity.title}</h4>
            </div>
            {nextActivity.start_time && (
              <span className="text-sm font-medium text-[var(--color-primary)]">
                {formatTime(nextActivity.start_time)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
