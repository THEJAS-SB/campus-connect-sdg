import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_ROUTES: Record<string, string> = {
  student: "/student",
  mentor: "/mentor",
  investor: "/investor",
  admin: "/admin",
};

const AUTH_PAGES = ["/sign-in", "/sign-up", "/"];
const PROTECTED_PREFIXES = ["/student", "/mentor", "/investor", "/admin"];

export async function proxy(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Redirect authenticated users away from auth pages
  if (user && AUTH_PAGES.includes(path)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "student";
    const destination = ROLE_ROUTES[role] ?? "/student";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Redirect unauthenticated users away from protected pages
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    path.startsWith(prefix),
  );
  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
