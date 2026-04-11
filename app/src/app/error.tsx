"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary.
 *
 * Catches unhandled errors inside `/app/**` pages and shows a friendly
 * recovery UI with a Retry button and a link back to the dashboard.
 *
 * Next.js 14 App Router convention:
 *   https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the browser console for dev visibility. In production this is
    // where a real error-tracking SDK (Sentry, LogRocket, etc.) would go.
    // eslint-disable-next-line no-console
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-white dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-rr-charcoal dark:text-white mb-1">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          An unexpected error interrupted this page. Your work is saved —
          retry to continue.
        </p>
        {error.digest && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mb-4">
            ref: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-rr-pink text-white font-semibold rounded-lg hover:bg-rr-pink/90 transition text-sm"
          >
            Retry
          </button>
          <a
            href="/dashboard/month"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-rr-charcoal dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
