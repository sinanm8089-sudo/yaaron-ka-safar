import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


class SupabaseError(Exception):
    pass


def _settings():
    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '').rstrip('/')
    key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') or os.environ.get('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    if not url or not key:
        raise SupabaseError('Supabase URL and publishable/anon key must be configured.')
    return url, key


def _request(path, method='GET', payload=None, params=None, token=None, secret=False, prefer=None):
    url, public_key = _settings()
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '') if secret else public_key
    if not key:
        raise SupabaseError('The server-side Supabase key is not configured.')
    query = f'?{urlencode(params, doseq=True)}' if params else ''
    headers = {
        'apikey': key,
        'User-Agent': 'yaaron-ka-safar-django/1.0',
        'Accept': 'application/json',
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'
    if payload is not None:
        headers['Content-Type'] = 'application/json'
    if prefer:
        headers['Prefer'] = prefer
    body = json.dumps(payload).encode('utf-8') if payload is not None else None
    request = Request(f'{url}{path}{query}', data=body, headers=headers, method=method)
    try:
        with urlopen(request, timeout=20) as response:
            raw = response.read()
    except HTTPError as error:
        message = error.read().decode('utf-8', errors='replace')
        try:
            details = json.loads(message)
            message = details.get('msg') or details.get('message') or details.get('error_description') or message
        except json.JSONDecodeError:
            pass
        raise SupabaseError(message or f'Supabase returned HTTP {error.code}.') from error
    except (TimeoutError, URLError) as error:
        raise SupabaseError('Could not connect to Supabase.') from error
    if not raw:
        return None
    try:
        return json.loads(raw.decode('utf-8'))
    except json.JSONDecodeError as error:
        raise SupabaseError('Supabase returned an unreadable response.') from error


def rest_list(table, params=None, token=None):
    return _request(f'/rest/v1/{table}', params={'select': '*', **(params or {})}, token=token) or []


def rest_insert(table, values, token=None, secret=False):
    return _request(f'/rest/v1/{table}', method='POST', payload=values, token=token, secret=secret, prefer='return=representation')


def rest_upsert(table, values, conflict, token=None):
    return _request(f'/rest/v1/{table}', method='POST', params={'on_conflict': conflict}, payload=values, token=token, prefer='resolution=merge-duplicates,return=representation')


def rest_update(table, filters, values, token=None, secret=False):
    return _request(f'/rest/v1/{table}', method='PATCH', params=filters, payload=values, token=token, secret=secret, prefer='return=representation')


def rest_delete(table, filters, token=None, secret=False):
    return _request(f'/rest/v1/{table}', method='DELETE', params=filters, token=token, secret=secret, prefer='return=representation')


def storage_upload(bucket, path, content, content_type, token):
    url, key = _settings()
    encoded_path = '/'.join(quote(part, safe='') for part in path.split('/'))
    request = Request(
        f'{url}/storage/v1/object/{bucket}/{encoded_path}',
        data=content,
        headers={
            'apikey': key,
            'Authorization': f'Bearer {token}',
            'User-Agent': 'yaaron-ka-safar-django/1.0',
            'Content-Type': content_type,
            'x-upsert': 'false',
        },
        method='POST',
    )
    try:
        with urlopen(request, timeout=30) as response:
            raw = response.read()
    except HTTPError as error:
        message = error.read().decode('utf-8', errors='replace')
        raise SupabaseError(message or f'Supabase Storage returned HTTP {error.code}.') from error
    except (TimeoutError, URLError) as error:
        raise SupabaseError('Could not connect to Supabase Storage.') from error
    return json.loads(raw.decode('utf-8')) if raw else None


def storage_public_url(bucket, path):
    url, _ = _settings()
    encoded_path = '/'.join(quote(part, safe='') for part in path.split('/'))
    return f'{url}/storage/v1/object/public/{bucket}/{encoded_path}'


def auth_password(admission_number, password):
    return _request('/auth/v1/token', method='POST', params={'grant_type': 'password'}, payload={
        'email': f'{admission_number.strip()}@yaaron.com',
        'password': password,
    })


def auth_refresh(refresh_token):
    return _request('/auth/v1/token', method='POST', params={'grant_type': 'refresh_token'}, payload={
        'refresh_token': refresh_token,
    })


def auth_current_user(token):
    return _request('/auth/v1/user', token=token)


def auth_admin_create(email, password, full_name):
    return _request('/auth/v1/admin/users', method='POST', payload={
        'email': email,
        'password': password,
        'email_confirm': True,
        'user_metadata': {'full_name': full_name},
    }, secret=True)


def auth_admin_list_users(page=1, per_page=1000):
    return _request('/auth/v1/admin/users', params={'page': page, 'per_page': per_page}, secret=True)


def auth_admin_update(user_id, values):
    return _request(f'/auth/v1/admin/users/{user_id}', method='PUT', payload=values, secret=True)