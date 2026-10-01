'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signIn(formData: { admission_number: string; password: string }) {
  const supabase = await createClient();
  const admissionNumber = formData.admission_number.trim();
  if (!admissionNumber || !formData.password) {
    return { error: 'Enter your admission number and password.' };
  }

  const dummyEmail = `${admissionNumber}@yaaron.com`;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: dummyEmail,
    password: formData.password,
  });

  if (error) {
    return { error: 'Invalid admission number or password.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', data.user.id)
    .single();

  if (profileError || !profile || !['admin', 'student', 'principal'].includes(profile.role)) {
    await supabase.auth.signOut();
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
