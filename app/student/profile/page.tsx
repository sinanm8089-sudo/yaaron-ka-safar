import { createClient } from '@/lib/supabase/server';
import { Avatar } from '@/components/ui/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth/actions';
import { User, Phone, GraduationCap, Hash, LogOut, Bus } from 'lucide-react';

async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('profile_id', profile?.id)
    .single();

  return { profile, student, email: user.email };
}

export default async function StudentProfilePage() {
  const data = await getProfile();

  if (!data) {
    return <p className="text-[var(--color-text-secondary)]">Unable to load profile.</p>;
  }

  const { profile, student, email } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
        My Profile
      </h1>

      {/* Avatar + Name */}
      <div className="text-center">
        <Avatar name={profile?.full_name ?? 'Student'} size="lg" className="mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[var(--color-text)]">{profile?.full_name}</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">{email}</p>
      </div>

      {/* Info Cards */}
      <Card>
        <div className="space-y-4">
          {student?.admission_number && (
            <div className="flex items-center gap-3">
              <Hash className="w-4 h-4 text-[var(--color-text-muted)]" />
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Admission No.</p>
                <p className="text-sm text-[var(--color-text)]">{student.admission_number}</p>
              </div>
            </div>
          )}
          {student?.class_name && (
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 text-[var(--color-text-muted)]" />
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Class</p>
                <p className="text-sm text-[var(--color-text)]">{student.class_name} {student.division}</p>
              </div>
            </div>
          )}
          {profile?.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[var(--color-text-muted)]" />
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Phone</p>
                <p className="text-sm text-[var(--color-text)]">{profile.phone}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Sign Out */}
      <form action={signOut}>
        <Button type="submit" variant="danger" className="w-full" icon={<LogOut className="w-4 h-4" />}>
          Sign Out
        </Button>
      </form>
    </div>
  );
}
