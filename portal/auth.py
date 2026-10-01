from functools import wraps

from django.shortcuts import redirect
from django.utils import timezone

from . import supabase


def sign_in(request, admission_number, password):
    auth = supabase.auth_password(admission_number, password)
    user = auth.get('user') or {}
    user_id = user.get('id')
    if not user_id:
        raise supabase.SupabaseError('Invalid admission number or password.')
    profiles = supabase.rest_list('profiles', {'user_id': f'eq.{user_id}'}, token=auth['access_token'])
    profile = profiles[0] if profiles else None
    if not profile or profile.get('role') not in {'admin', 'student', 'principal'}:
        raise supabase.SupabaseError('No valid role profile is linked to this account.')
    request.session.cycle_key()
    request.session['supabase_access_token'] = auth['access_token']
    request.session['supabase_refresh_token'] = auth.get('refresh_token', '')
    request.session['supabase_expires_at'] = int(timezone.now().timestamp()) + int(auth.get('expires_in', 3600))
    request.session['profile'] = profile
    request.session['user_id'] = user_id
    request.session['email'] = user.get('email', '')
    return profile


def get_access_token(request):
    token = request.session.get('supabase_access_token')
    refresh_token = request.session.get('supabase_refresh_token')
    expires_at = request.session.get('supabase_expires_at', 0)
    if not token:
        return None
    if expires_at and expires_at <= int(timezone.now().timestamp()) + 60 and refresh_token:
        try:
            refreshed = supabase.auth_refresh(refresh_token)
            token = refreshed['access_token']
            request.session['supabase_access_token'] = token
            request.session['supabase_refresh_token'] = refreshed.get('refresh_token', refresh_token)
            request.session['supabase_expires_at'] = int(timezone.now().timestamp()) + int(refreshed.get('expires_in', 3600))
        except supabase.SupabaseError:
            request.session.flush()
            return None
    try:
        current = supabase.auth_current_user(token)
    except supabase.SupabaseError:
        request.session.flush()
        return None
    if current.get('id') != request.session.get('user_id'):
        request.session.flush()
        return None
    return token


def role_required(*roles):
    def decorator(view):
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            token = get_access_token(request)
            profile = request.session.get('profile')
            if not token or not profile:
                return redirect('login')
            if profile.get('role') not in roles:
                return redirect('dashboard')
            request.supabase_token = token
            request.profile = profile
            return view(request, *args, **kwargs)
        return wrapped
    return decorator