import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Temporary route to check sp_session_coaches schema on the app's Supabase.
 * GET /api/check-schema
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Query a single row with select * to see what columns PostgREST knows about
    const { data, error } = await supabase
      .from("sp_session_coaches")
      .select("*")
      .limit(1);

    // Also check sp_coaches table
    const { data: coachData, error: coachError } = await supabase
      .from("sp_coaches")
      .select("*")
      .limit(1);

    // Check sp_sessions
    const { data: sessionData, error: sessionError } = await supabase
      .from("sp_sessions")
      .select("id, date, start_time")
      .limit(3);

    return NextResponse.json({
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      has_db_url: !!process.env.DATABASE_URL,
      sp_session_coaches: {
        columns: data && data.length > 0 ? Object.keys(data[0]) : (error ? `error: ${error.message}` : "empty table - columns unknown"),
        row_count_check: data?.length ?? 0,
        error: error?.message,
      },
      sp_coaches: {
        columns: coachData && coachData.length > 0 ? Object.keys(coachData[0]) : (coachError ? `error: ${coachError.message}` : "empty"),
        sample: coachData?.slice(0, 2),
        error: coachError?.message,
      },
      sp_sessions: {
        sample: sessionData?.slice(0, 3),
        error: sessionError?.message,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
