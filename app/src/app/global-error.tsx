"use client";

import { useEffect } from "react";

/**
 * Global (root) error boundary.
 *
 * Catches errors that escape the root layout (including errors thrown by
 * layout.tsx itself). Must render its own <html> and <body> because it
 * replaces the whole document when it fires.
 *
 * Next.js 14 App Router convention:
 *   https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-global-errors
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
          padding: "16px",
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            width: "100%",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            Session Planner is unavailable
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              marginBottom: "24px",
            }}
          >
            A critical error prevented the app from loading. Please retry.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "10px",
                color: "#9ca3af",
                fontFamily: "monospace",
                marginBottom: "16px",
              }}
            >
              ref: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              background: "#E91E63",
              color: "#ffffff",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
