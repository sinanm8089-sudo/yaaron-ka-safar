'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/shared';
import { Bell, Check, Megaphone, ClipboardCheck, Camera, Calendar, Zap } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  attendance: <ClipboardCheck className="w-4 h-4" />,
  activity: <Zap className="w-4 h-4" />,
  schedule: <Calendar className="w-4 h-4" />,
  photo: <Camera className="w-4 h-4" />,
  announcement: <Megaphone className="w-4 h-4" />,
};

const typeColors: Record<string, string> = {
  attendance: 'text-[var(--color-primary)] bg-[var(--color-primary-glow)]',
  activity: 'text-[var(--color-accent)] bg-[var(--color-accent-glow)]',
  schedule: 'text-[var(--color-info)] bg-[var(--color-info-bg)]',
  photo: 'text-[var(--color-success)] bg-[var(--color-success-bg)]',
  announcement: 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]',
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Array<{
    id: string; type: string; title: string; message: string; is_read: boolean; created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifications(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-[var(--radius-xl)] bg-[var(--color-surface)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
        Notifications
      </h1>

      {notifications.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-secondary)]">No notifications yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border transition-colors ${
                notif.is_read
                  ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  : 'border-[var(--color-primary)]/20 bg-[var(--color-surface-elevated)]'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[notif.type] ?? 'text-[var(--color-text-muted)] bg-[var(--color-surface-elevated)]'}`}>
                {typeIcons[notif.type] ?? <Bell className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium text-[var(--color-text)]">{notif.title}</h4>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                  )}
                </div>
                {notif.message && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                )}
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                  {new Date(notif.created_at).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
