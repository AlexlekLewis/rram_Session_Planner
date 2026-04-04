"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [magicSent, setMagicSent] = useState(false);

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
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-rr-charcoal dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rr-pink/30 focus:border-rr-pink transition bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="••••••••"
                    required
                  />
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
