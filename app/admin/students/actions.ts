'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function addStudentAction(formData: FormData) {
  try {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fullName = formData.get('full_name') as string;
    const admissionNumber = formData.get('admission_number') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const className = formData.get('class_name') as string;
    const division = formData.get('division') as string;
    const tripFee = parseFloat(formData.get('trip_fee') as string);
    const busNumber = formData.get('bus_number') as string;
    const emergencyContact = formData.get('emergency_contact') as string;

    if (!fullName || !admissionNumber || !password || !phone) {
      return { error: 'Full name, Admission Number, Phone, and Password are required.' };
    }

    // 1. Create Auth User
    const dummyEmail = `${admissionNumber}@yaaron.com`;
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: dummyEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      }
    });

    if (authError || !authData.user) {
      return { error: authError?.message || 'Failed to create user account' };
    }

    // 2. Insert into profiles table
    // (We must manually insert since we are using dummy email, or perhaps a trigger already does it, 
    // but the trigger might not have the phone number. Assuming we update it.)
    
    // Check if profile was auto-created by trigger
    let { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (!profile) {
      const { data: newProfile, error: profileError } = await adminClient
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          role: 'student',
          full_name: fullName,
          phone: phone
        })
        .select()
        .single();
      
      if (profileError) return { error: profileError.message };
      profile = newProfile;
    } else {
      await adminClient
        .from('profiles')
        .update({ full_name: fullName, phone: phone, role: 'student' })
        .eq('user_id', authData.user.id);
    }

    // 3. Insert into students table
    const { error: studentError } = await adminClient
      .from('students')
      .insert({
        profile_id: profile.id,
        full_name: fullName,
        admission_number: admissionNumber,
        phone: phone,
        class_name: className,
        division: division,
        trip_fee: isNaN(tripFee) ? 0 : tripFee,
        bus_number: busNumber,
        emergency_contact: emergencyContact,
        medical_conditions: null
      });

    if (studentError) {
      // Rollback might be needed but skipping for simplicity
      return { error: studentError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function changeStudentPasswordAction(userId: string, newPassword: string) {
  try {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (!newPassword || newPassword.length < 6) {
      return { error: 'Password must be at least 6 characters long' };
    }

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
