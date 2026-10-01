# Yaaron Ka Safar

Django server-rendered trip operations portal. Supabase Auth and the existing Supabase tables remain the identity and data services, so the existing student, admin, and principal accounts are preserved.

## Run locally

1. Use Python 3.12 or later and install dependencies:

```powershell
py -m pip install -r requirements.txt
```

2. Copy `.env.local.example` to `.env.local` and fill in the existing Supabase project URL and public key. Keep the server-only secret out of source control.

3. Start Django:

```powershell
py manage.py migrate
py manage.py runserver
```

Open `http://127.0.0.1:8000/`.

The project includes existing Next.js files only as a temporary migration/reference copy. Django is the intended web entry point.

## Supabase settings

Set these variables in `.env.local` for development and in the hosting provider's server environment for deployment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; only required for Auth Admin operations such as student account provisioning)
- `DJANGO_SECRET_KEY` (generate a unique, private value for each environment)
- `DJANGO_ALLOWED_HOSTS` (comma-separated hostnames for deployment)
- `DJANGO_DEBUG=false` in production

The student attendance-request and student-report features also need `supabase/migrations/20261001052254_student_attendance_requests_and_reports.sql` applied to the connected Supabase database before use. That migration is not applied automatically by Django.

## Tests and deployment

Run project checks and tests with:

```powershell
py manage.py check
py manage.py test portal
```

For a Django-compatible host, use `config.wsgi:application` as the WSGI entry point and install from `requirements.txt`. Set the environment variables above in the host dashboard. Vercel deployments need a Django-compatible Python runtime/build configuration; they will not deploy this app through Next.js defaults.
