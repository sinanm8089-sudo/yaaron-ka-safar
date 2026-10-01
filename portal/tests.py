from unittest.mock import patch

from django.test import TestCase


class LoginTests(TestCase):
    @patch('portal.auth.supabase.rest_list')
    @patch('portal.auth.supabase.auth_password')
    def test_login_uses_supabase_auth_and_starts_role_session(self, auth_password, rest_list):
        auth_password.return_value = {
            'access_token': 'access-token',
            'refresh_token': 'refresh-token',
            'expires_in': 3600,
            'user': {'id': 'user-1', 'email': 'IVS3-001@yaaron.com'},
        }
        rest_list.return_value = [{
            'id': 'profile-1', 'user_id': 'user-1', 'full_name': 'Student One', 'role': 'student',
        }]

        response = self.client.post('/login/', {'admission_number': ' IVS3-001 ', 'password': 'password'})

        self.assertRedirects(response, '/dashboard/', fetch_redirect_response=False)
        self.assertEqual(auth_password.call_args.args, ('IVS3-001', 'password'))
        self.assertEqual(self.client.session['profile']['role'], 'student')
        self.assertEqual(self.client.session['user_id'], 'user-1')

    @patch('portal.auth.supabase.auth_password')
    def test_invalid_auth_shows_error_and_does_not_create_session(self, auth_password):
        from portal.supabase import SupabaseError

        auth_password.side_effect = SupabaseError('Invalid admission number or password.')
        response = self.client.post('/login/', {'admission_number': 'missing', 'password': 'wrong'})

        self.assertEqual(response.status_code, 200)
        self.assertNotIn('supabase_access_token', self.client.session)


class RoleAccessTests(TestCase):
    @patch('portal.views.supabase.rest_list', return_value=[])
    @patch('portal.auth.supabase.auth_current_user')
    def test_student_cannot_open_admin_section(self, current_user, rest_list):
        current_user.return_value = {'id': 'student-user'}
        session = self.client.session
        session['supabase_access_token'] = 'token'
        session['supabase_refresh_token'] = 'refresh'
        session['supabase_expires_at'] = 9999999999
        session['user_id'] = 'student-user'
        session['profile'] = {'id': 'student-profile', 'role': 'student', 'full_name': 'Student'}
        session.save()

        response = self.client.get('/admin/profiles/')

        self.assertRedirects(response, '/dashboard/', fetch_redirect_response=False)
        rest_list.assert_not_called()

    @patch('portal.views.supabase.rest_list', return_value=[])
    @patch('portal.auth.supabase.auth_current_user')
    def test_admin_profiles_page_renders(self, current_user, rest_list):
        current_user.return_value = {'id': 'admin-user'}
        session = self.client.session
        session['supabase_access_token'] = 'token'
        session['supabase_refresh_token'] = 'refresh'
        session['supabase_expires_at'] = 9999999999
        session['user_id'] = 'admin-user'
        session['profile'] = {'id': 'admin-profile', 'role': 'admin', 'full_name': 'Admin'}
        session.save()

        response = self.client.get('/admin/profiles/')

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Profiles')