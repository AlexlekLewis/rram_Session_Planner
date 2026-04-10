import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as
          | "recovery"
      | "email"
      | "signup"
      | "invite"
      | "magiclink"
      | null;
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard/month";

  const cookieStore = cookies();
    const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
              cookies: {
                        get(name: string) {
                                    return cookieStore.get(name)?.value;
                        },
                        set(name: string, value: string, options: CookieOptions) {
                                    cookieStore.set({ name, value, ...options });
                        },
                        remove(name: string, options: CookieOptions) {
                                    cookieStore.set({ name, value: "", ...options });
                        },
              },
      }
        );

  // PKCE flow: exchange the code for a session
  if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
                // Redirect to `next` param (defaults to /dashboard/month, or /reset-password for recovery)
          return NextResponse.redirect(new URL(next, request.url));
        }
  }

  // Implicit flow fallback: verify the OTP token hash
  if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type });
        if (!error) {
                if (type === "recovery") {
                          return NextResponse.redirect(new URL("/reset-password", request.url));
                }
                return NextResponse.redirect(new URL(next, request.url));
        }
  }

  // If token exchange failed, redirect to login with error
  return NextResponse.redirect(
        new URL("/login?error=invalid_token", request.url)
      );
}
