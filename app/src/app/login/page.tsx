"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Show error if redirected from a failed token exchange
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "invalid_token") {
      setError("Password reset link has expired or is invalid. Please try again.");
    }
  }, []);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [magicSent, setMagicSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const supabase = createClient();

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/dashboard/month";
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setError("Enter your email first, then click Forgot Password.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard/month` },
    });
    if (error) {
      setError(error.message);
    } else {
      setMagicSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-rr-gradient p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="RRA Melbourne"
            width={120}
            height={120}
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-rr-charcoal dark:text-white mb-1">
          Session Planner
        </h1>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
          RRA Melbourne Elite Program 2026
        </p>

        {magicSent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-rr-charcoal mb-2">Check your email</h2>
            <p className="text-sm text-gray-500">
              We sent a magic link to <strong>{email}</strong>
            </p>
            <button
              onClick={() => setMagicSent(false)}
              className="mt-4 text-sm text-rr-medium-blue hover:underline"
            >
              Try a different method
            </button>
          </div>
        ) : (
          <>
            {/* Mode Toggle */}
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-6">
              <button
                onClick={() => setMode("password")}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  mode === "password"
                    ? "bg-white dark:bg-gray-600 text-rr-blue dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Password
              </button>
              <button
                onClick={() => setMode("magic")}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  mode === "magic"
                    ? "bg-white dark:bg-gray-600 text-rr-blue dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Magic Link
              </button>
            </div>

            <form onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-rr-charcoal dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rr-pink/30 focus:border-rr-pink transition bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="coach@rramelbourne.com"
                  required
                />
              </div>

              {mode === "password" && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-rr-charcoal dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rr-pink/30 focus:border-rr-pink transition bg-white dark:bg-gray-700 dark:text-white"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="text-xs text-rr-medium-blue hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}

              {resetSent && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Password reset link sent to <strong>{email}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => setResetSent(false)}
                    className="mt-1 text-xs text-green-600 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500 mb-4">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-rr-pink text-white font-semibold rounded-lg hover:bg-rr-pink/90 transition disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : mode === "password"
                  ? "Sign In"
                  : "Send Magic Link"}
              </button>
            </form>
          </>
        )}

        <p className="text-xs text-center text-gray-400 mt-6">
          Rajasthan Royals Academy Melbourne
        </p>
      </div>
    </div>
  );
}
