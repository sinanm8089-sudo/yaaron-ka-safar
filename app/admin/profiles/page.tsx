import { createClient } from '@/lib/supabase/server';
import { Badge, Avatar, EmptyState } from '@/components/ui/shared';
import { Users, Shield, GraduationCap, Crown } from 'lucide-react';
import type { Profile } from '@/types';

const roleConfig = {
  admin: { label: 'Admin', variant: 'danger' as const, icon: Shield },
  student: { label: 'Student', variant: 'primary' as const, icon: GraduationCap },
  principal: { label: 'Principal', variant: 'warning' as const, icon: Crown },
};

export default async function AdminProfilesPage() {
  const supabase = await createClient();

  // Fetch all profiles sorted by creation date (earliest first)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-danger)]/20 bg-[var(--color-danger-bg)] p-6">
        <p className="text-sm text-[var(--color-danger)]">Failed to load profiles: {error.message}</p>
      </div>
    );
  }

  const typedProfiles = (profiles ?? []) as Profile[];

  // Stats by role
  const adminCount = typedProfiles.filter(p => p.role === 'admin').length;
  const studentCount = typedProfiles.filter(p => p.role === 'student').length;
  const principalCount = typedProfiles.filter(p => p.role === 'principal').length;

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          All Profiles
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {typedProfiles.length} total profiles — sorted by creation date
        </p>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-3 gap-3 stagger-children">
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shine text-center">
          <Shield className="w-5 h-5 text-[var(--color-danger)] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[var(--color-text)]">{adminCount}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Admins</p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shine text-center">
          <GraduationCap className="w-5 h-5 text-[var(--color-primary)] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[var(--color-text)]">{studentCount}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Students</p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shine text-center">
          <Crown className="w-5 h-5 text-[var(--color-warning)] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[var(--color-text)]">{principalCount}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Principals</p>
        </div>
      </div>

      {/* Profiles List */}
      {typedProfiles.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No profiles found"
          description="There are no profiles in the database yet."
        />
      ) : (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
          {/* Table Header — Desktop */}
          <div className="hidden lg:grid grid-cols-[auto_1fr_120px_160px_180px] gap-4 px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider w-10">#</span>
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Name</span>
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Role</span>
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Phone</span>
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Joined</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--color-border)]">
            {typedProfiles.map((profile, index) => {
              const config = roleConfig[profile.role];
              const RoleIcon = config.icon;
              const createdDate = new Date(profile.created_at);

              return (
                <div
                  key={profile.id}
                  className="flex items-center gap-4 px-4 lg:px-6 py-4 hover:bg-[var(--color-surface-elevated)] transition-colors lg:grid lg:grid-cols-[auto_1fr_120px_160px_180px]"
                >
                  {/* Index */}
                  <span className="hidden lg:block text-xs text-[var(--color-text-muted)] font-mono w-10">
                    {index + 1}
                  </span>

                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                        {profile.full_name}
                      </p>
                      {/* Mobile: show role + phone below name */}
                      <div className="flex items-center gap-2 lg:hidden mt-0.5">
                        <Badge variant={config.variant} size="sm">
                          <RoleIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                        {profile.phone && (
                          <span className="text-xs text-[var(--color-text-muted)]">{profile.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role — Desktop */}
                  <div className="hidden lg:block">
                    <Badge variant={config.variant} size="sm">
                      <RoleIcon className="w-3 h-3" />
                      {config.label}
                    </Badge>
                  </div>

                  {/* Phone — Desktop */}
                  <span className="hidden lg:block text-sm text-[var(--color-text-secondary)]">
                    {profile.phone || '—'}
                  </span>

                  {/* Joined Date */}
                  <div className="text-right lg:text-left flex-shrink-0">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {createdDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      {createdDate.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
