"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [recoveryValid, setRecoveryValid] = useState(false);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Detect recovery session.
  //
  // SECURITY: We ONLY trust the PASSWORD_RECOVERY auth event. We intentionally
  // do NOT fall back to `getSession()` + "is there a session?" — that allowed
  // any already-signed-in user who happened to navigate to /reset-password to
  // change the password of the account they were already logged into (e.g. if
  // they closed the original tab). The recovery link should be the ONLY way
  // to enter this flow. See PASSWD-001 in the 2026-04-10 audit.
  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, _session: Session | null) => {
        if (!mounted) return;
        if (event === "PASSWORD_RECOVERY") {
          setRecoveryValid(true);
          setReady(true);
        }
      }
    );

    // If we haven't received PASSWORD_RECOVERY within a short window, mark
    // the link as invalid so the user sees an error rather than a spinner.
    const timer = setTimeout(() => {
      if (mounted) setReady(true);
    }, 1_500);

    return () => {
      mounted = false;
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    // Sign out so the next login uses the new password explicitly.
    await supabase.auth.signOut();
    setTimeout(() => {
      window.location.href = "/login";
    }, 2_000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-rr-gradient p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="RRA Melbourne" width={120} height={120} priority />
        </div>

        <h1 className="text-2xl font-bold text-center text-rr-charcoal dark:text-white mb-1">
          Set New Password
        </h1>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
          Choose a new password for your account
        </p>

        {!ready ? (
          <p className="text-sm text-center text-gray-500">Verifying reset link…</p>
        ) : !recoveryValid ? (
          <div className="text-center py-4">
            <p className="text-sm text-red-500 mb-4">
              This password reset link is invalid or has expired.
            </p>
            <a href="/login" className="text-sm text-rr-medium-blue hover:underline">
              Back to sign in
            </a>
          </div>
        ) : success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-rr-charcoal mb-2">Password updated</h2>
            <p className="text-sm text-gray-500">Redirecting to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-rr-charcoal dark:text-gray-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rr-pink/30 focus:border-rr-pink transition bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-rr-charcoal dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rr-pink/30 focus:border-rr-pink transition bg-white dark:bg-gray-700 dark:text-white"
                placeholder="Re-enter new password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-rr-pink text-white font-semibold rounded-lg hover:bg-rr-pink/90 transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <p className="text-xs text-center text-gray-400 mt-6">
          Rajasthan Royals Academy Melbourne
        </p>
      </div>
    </div>
  );
}
