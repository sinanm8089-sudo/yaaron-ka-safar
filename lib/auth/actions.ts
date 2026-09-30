'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function signIn(formData: { admission_number: string; password: string }) {
  const supabase = await createClient();
  
  // 1. Create an admin client to bypass RLS and look up the phone number
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. Find the student by admission number
  const { data: student, error: studentError } = await adminClient
    .from('students')
    .select('phone')
    .eq('admission_number', formData.admission_number)
    .single();

  if (studentError || !student || !student.phone) {
    return { error: 'Invalid admission number or user not found.' };
  }

  // 3. Log in with the dummy email to completely bypass Phone Auth restrictions
  const dummyEmail = `${formData.admission_number}@yaaron.com`;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: dummyEmail,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Get profile to determine redirect
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', data.user.id)
    .single();

  if (!profile) {
    return { error: 'Profile not found. Contact admin.' };
  }

  redirect(`/${profile.role}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return { user, profile };
}
