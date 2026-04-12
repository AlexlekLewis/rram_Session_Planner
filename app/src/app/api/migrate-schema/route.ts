import { NextRequest, NextResponse } from "next/server";

/**
 * Temporary migration route to add missing columns to sp_session_coaches
 * and sp_coach_availability on the app's Supabase project.
 *
 * Uses the Supabase Management API / direct SQL via the REST endpoint.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If we don't have service role key, try using the anon key with RPC
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    return NextResponse.json({ error: "No SUPABASE_URL configured" }, { status: 500 });
  }

  const key = serviceRoleKey || anonKey;
  if (!key) {
    return NextResponse.json({ error: "No Supabase key configured" }, { status: 500 });
  }

  // Use the Supabase SQL endpoint (requires service role key)
  // If that's not available, we'll report what we know
  const migrations = [
    "ALTER TABLE sp_session_coaches ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES sp_coaches(id);",
    "ALTER TABLE sp_session_coaches ADD COLUMN IF NOT EXISTS coach_role TEXT DEFAULT 'assistant' CHECK (coach_role IN ('squad_coach', 'assistant', 'specialist'));",
    "ALTER TABLE sp_session_coaches ADD COLUMN IF NOT EXISTS hour INTEGER;",
    "ALTER TABLE sp_session_coaches ALTER COLUMN user_id DROP NOT NULL;",
    "ALTER TABLE sp_coach_availability ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sp_sessions(id);",
    "CREATE INDEX IF NOT EXISTS idx_session_coaches_coach ON sp_session_coaches(coach_id);",
    "CREATE INDEX IF NOT EXISTS idx_coach_availability_session ON sp_coach_availability(session_id);",
  ];

  const results: { sql: string; status: string; error?: string }[] = [];

  for (const sql of migrations) {
    try {
      const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      if (resp.ok) {
        results.push({ sql, status: "ok" });
      } else {
        const text = await resp.text();
        results.push({ sql, status: "failed", error: text });
      }
    } catch (err) {
      results.push({ sql, status: "error", error: String(err) });
    }
  }

  return NextResponse.json({
    supabase_url: supabaseUrl,
    has_service_role_key: !!serviceRoleKey,
    results,
    note: "If migrations failed, you need to run these SQL statements directly in the Supabase dashboard SQL editor.",
    manual_sql: migrations.join("\n"),
  });
}
