'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';

interface ParsedStudent {
  row: number;
  name: string;
  admission_number: string;
  password?: string;
  class_name?: string;
  total_amount: number;
  amount_paid: number;
}

export async function importStudentsAction(students: ParsedStudent[]) {
  try {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: trip } = await adminClient.from('trips').select('id').single();
    if (!trip) {
      return { error: 'No trip found in the database. Please create a trip first.' };
    }

    let importedCount = 0;

    for (const student of students) {
      const admissionNumber = student.admission_number;
      
      // Default password: First name lowercase + 123 (if not provided)
      const firstName = student.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      const password = student.password || (firstName.length >= 3 ? `${firstName}123` : `pass1234`);

      // 1. Create Auth User
      const dummyEmail = `${admissionNumber}@yaaron.com`;
      
      // Check if user already exists
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      let authUser = existingUsers.users.find(u => u.email === dummyEmail);

      if (!authUser) {
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: dummyEmail,
          password: password,
          email_confirm: true,
          user_metadata: { full_name: student.name }
        });
        
        if (authError || !authData.user) {
          console.error(`Failed to create auth for ${student.name}:`, authError);
          continue; // Skip this student if auth fails
        }
        authUser = authData.user;
      } else {
        // Optionally update password to default if user exists? We'll skip for now.
      }

      // 2. Create or Update Profile
      let { data: profile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (!profile) {
        const { data: newProfile, error: profileError } = await adminClient
          .from('profiles')
          .insert({
            user_id: authUser.id,
            role: 'student',
            full_name: student.name,
            phone: '0000000000'
          })
          .select()
          .single();
        if (profileError) {
          console.error(`Failed to create profile for ${student.name}:`, profileError);
          continue;
        }
        profile = newProfile;
      }

      // 3. Create or Update Student Record
      let { data: studentRecord } = await adminClient
        .from('students')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (studentRecord) {
        // Update
        await adminClient.from('students').update({
          full_name: student.name,
          class_name: student.class_name,
          trip_fee: student.total_amount,
          serial_number: student.row - 1
        }).eq('id', studentRecord.id);
      } else {
        // Insert
        const { data: newStudentRecord, error: studentError } = await adminClient.from('students').insert({
          profile_id: profile.id,
          full_name: student.name,
          admission_number: admissionNumber,
          phone: '0000000000',
          class_name: student.class_name,
          trip_id: trip.id,
          trip_fee: student.total_amount,
          serial_number: student.row - 1
        }).select().single();
        
        if (studentError) {
          console.error(`Failed to create student record for ${student.name}:`, studentError);
          continue;
        }
        studentRecord = newStudentRecord;
      }

      // 4. Create Initial Payment if any
      if (student.amount_paid > 0) {
        // Check if a payment already exists
        const { data: existingPayments } = await adminClient
          .from('payments')
          .select('id')
          .eq('student_id', studentRecord.id);

        if (!existingPayments || existingPayments.length === 0) {
          await adminClient.from('payments').insert({
            student_id: studentRecord.id,
            amount: student.amount_paid,
            payment_method: 'cash',
            payment_date: new Date().toISOString().split('T')[0],
            notes: 'Imported from Excel'
          });
        }
      }

      importedCount++;
    }

    return { success: true, count: importedCount };
  } catch (err: any) {
    return { error: err.message };
  }
}
