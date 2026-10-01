'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'You must be signed in as an admin to import students.' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      return { error: 'You must be an admin to import students.' };
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: trip, error: tripError } = await adminClient.from('trips').select('id').single();
    if (tripError || !trip) {
      return { error: 'No trip found in the database. Please create a trip first.' };
    }

    let importedCount = 0;
    const failures: string[] = [];

    const authUsers = new Map<string, { id: string }>();
    const perPage = 1000;
    for (let page = 1; ; page++) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) return { error: `Could not load existing accounts: ${error.message}` };
      for (const user of data.users) {
        if (user.email) authUsers.set(user.email.toLowerCase(), { id: user.id });
      }
      if (data.users.length < perPage) break;
    }

    for (const student of students) {
      const admissionNumber = student.admission_number.trim();
      const dummyEmail = `${admissionNumber}@yaaron.com`;
      const password = student.password?.trim() || '12345678';

      try {
        let authUser = authUsers.get(dummyEmail.toLowerCase());
        if (authUser) {
          const { error: authError } = await adminClient.auth.admin.updateUserById(authUser.id, {
            password,
            user_metadata: { full_name: student.name },
          });
          if (authError) throw authError;
        } else {
          const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: dummyEmail,
            password,
            email_confirm: true,
            user_metadata: { full_name: student.name },
          });
          if (authError || !authData.user) throw authError ?? new Error('Auth user was not created.');
          authUser = { id: authData.user.id };
          authUsers.set(dummyEmail.toLowerCase(), authUser);
        }

        const { data: existingProfile, error: profileLookupError } = await adminClient
          .from('profiles')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle();
        if (profileLookupError) throw profileLookupError;

        let profileId = existingProfile?.id;
        if (profileId) {
          const { error: profileUpdateError } = await adminClient
            .from('profiles')
            .update({ full_name: student.name, role: 'student' })
            .eq('id', profileId);
          if (profileUpdateError) throw profileUpdateError;
        } else {
          const { data: newProfile, error: profileError } = await adminClient
            .from('profiles')
            .insert({ user_id: authUser.id, role: 'student', full_name: student.name })
            .select('id')
            .single();
          if (profileError || !newProfile) throw profileError ?? new Error('Student profile was not created.');
          profileId = newProfile.id;
        }

        const { data: matchedStudent, error: studentLookupError } = await adminClient
          .from('students')
          .select('id')
          .eq('admission_number', admissionNumber)
          .maybeSingle();
        if (studentLookupError) throw studentLookupError;

        const studentRecordQuery = matchedStudent
          ? adminClient.from('students').update({
              profile_id: profileId,
              full_name: student.name,
              admission_number: admissionNumber,
              class_name: student.class_name ?? null,
              trip_id: trip.id,
              trip_fee: student.total_amount,
              serial_number: student.row,
            }).eq('id', matchedStudent.id).select('id').single()
          : adminClient.from('students').select('id').eq('profile_id', profileId).maybeSingle();

        let studentRecord: { id: string } | null;
        if (matchedStudent) {
          const { data, error: studentUpdateError } = await studentRecordQuery;
          if (studentUpdateError || !data) throw studentUpdateError ?? new Error('Student record was not updated.');
          studentRecord = data;
        } else {
          const { data: linkedStudent, error: linkedStudentError } = await studentRecordQuery;
          if (linkedStudentError) throw linkedStudentError;
          if (linkedStudent) {
            const { data, error: studentUpdateError } = await adminClient
              .from('students')
              .update({
                full_name: student.name,
                admission_number: admissionNumber,
                class_name: student.class_name ?? null,
                trip_id: trip.id,
                trip_fee: student.total_amount,
                serial_number: student.row,
              })
              .eq('id', linkedStudent.id)
              .select('id')
              .single();
            if (studentUpdateError || !data) throw studentUpdateError ?? new Error('Student record was not updated.');
            studentRecord = data;
          } else {
            const { data, error: studentInsertError } = await adminClient
              .from('students')
              .insert({
                profile_id: profileId,
                full_name: student.name,
                admission_number: admissionNumber,
                class_name: student.class_name ?? null,
                trip_id: trip.id,
                trip_fee: student.total_amount,
                serial_number: student.row,
              })
              .select('id')
              .single();
            if (studentInsertError || !data) throw studentInsertError ?? new Error('Student record was not created.');
            studentRecord = data;
          }
        }

        if (student.amount_paid > 0) {
          const { data: existingPayments, error: paymentLookupError } = await adminClient
            .from('payments')
            .select('id')
            .eq('student_id', studentRecord.id);
          if (paymentLookupError) throw paymentLookupError;

          if (!existingPayments.length) {
            const { error: paymentError } = await adminClient.from('payments').insert({
              student_id: studentRecord.id,
              amount: student.amount_paid,
              payment_method: 'cash',
              payment_date: new Date().toISOString().split('T')[0],
              notes: 'Imported from Excel',
            });
            if (paymentError) throw paymentError;
          }
        }

        importedCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected import error.';
        failures.push(`${admissionNumber}: ${message}`);
      }
    }

    if (failures.length) {
      return {
        error: `Imported ${importedCount} of ${students.length}. ${failures.slice(0, 5).join(' ')}`,
        count: importedCount,
      };
    }

    return { success: true, count: importedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected import error.';
    return { error: message };
  }
}
