import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public paths that don't require auth
  const publicPaths = ['/login', '/'];
  const isPublicPath = publicPaths.some(p => pathname === p);

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is logged in and on login page, redirect based on role
  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      const url = request.nextUrl.clone();
      switch (profile.role) {
        case 'admin':
          url.pathname = '/admin';
          break;
        case 'student':
          url.pathname = '/student';
          break;
        case 'principal':
          url.pathname = '/principal';
          break;
        default:
          url.pathname = '/login';
      }
      return NextResponse.redirect(url);
    }
  }

  // Role-based route protection
  if (user && !isPublicPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      const role = profile.role;
      const isAdminRoute = pathname.startsWith('/admin');
      const isStudentRoute = pathname.startsWith('/student');
      const isPrincipalRoute = pathname.startsWith('/principal');

      if (
        (isAdminRoute && role !== 'admin') ||
        (isStudentRoute && role !== 'student') ||
        (isPrincipalRoute && role !== 'principal')
      ) {
        const url = request.nextUrl.clone();
        url.pathname = `/${role}`;
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
