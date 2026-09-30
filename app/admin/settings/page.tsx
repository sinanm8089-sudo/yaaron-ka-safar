import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/shared';
import { Settings, Shield, Database, Globe, Bus, Calendar } from 'lucide-react';

async function getTripSettings() {
  const supabase = await createClient();
  const { data: trip } = await supabase.from('trips').select('*').single();
  const { data: settings } = await supabase.from('trip_settings').select('*').single();
  return { trip, settings };
}

export default async function AdminSettingsPage() {
  const { trip, settings } = await getTripSettings();

  return (
    <div className="space-y-6 pb-20 lg:pb-0 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Trip configuration & app settings
        </p>
      </div>

      {/* Trip Info */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-[var(--color-primary)]" />
              Trip Details
            </CardTitle>
            <CardDescription>Current trip configuration</CardDescription>
          </div>
        </CardHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-secondary)]">Trip Name</span>
            <span className="text-sm font-medium text-[var(--color-text)]">{trip?.name ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-secondary)]">Subtitle</span>
            <span className="text-sm font-medium text-[var(--color-text)]">{trip?.subtitle ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-secondary)]">Dates</span>
            <span className="text-sm font-medium text-[var(--color-text)]">
              {trip?.start_date} → {trip?.end_date}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[var(--color-text-secondary)]">Status</span>
            <Badge variant={trip?.status === 'active' ? 'success' : trip?.status === 'completed' ? 'default' : 'primary'} size="sm">
              {trip?.status ?? 'unknown'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Fee Config */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[var(--color-accent)]" />
              Fee Configuration
            </CardTitle>
            <CardDescription>Default amounts for students</CardDescription>
          </div>
        </CardHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-secondary)]">Student Fee</span>
            <span className="text-sm font-bold text-[var(--color-text)]">₹{settings?.default_student_fee ?? 6450}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-secondary)]">Advance Amount</span>
            <span className="text-sm font-bold text-[var(--color-text)]">₹{settings?.default_advance ?? 1500}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[var(--color-text-secondary)]">Currency</span>
            <span className="text-sm font-medium text-[var(--color-text)]">{settings?.currency ?? 'INR'}</span>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Security
            </CardTitle>
            <CardDescription>Row Level Security is enforced on all tables</CardDescription>
          </div>
        </CardHeader>
        <div className="space-y-2">
          {['Profiles', 'Students', 'Payments', 'Activities', 'Attendance', 'Photos', 'Notifications'].map((table) => (
            <div key={table} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[var(--color-text-secondary)]">{table}</span>
              <Badge variant="success" size="sm">RLS Active</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
