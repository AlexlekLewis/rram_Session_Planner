import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Seed Coaches API Route
 *
 * Populates sp_session_coaches with 140 coach allocations for Month 1.
 * This is a temporary route for data seeding during development.
 *
 * GET /api/seed-coaches
 * - Fetches all coaches from sp_coaches (name -> id mapping)
 * - Fetches all sessions from sp_sessions (date + start_time -> id mapping)
 * - Deletes all existing rows from sp_session_coaches
 * - Inserts the 140 coach allocations
 * - Returns JSON with count of inserted rows
 */

interface CoachAllocation {
  coach_name: string;
  date: string;
  start_time: string;
  coach_role: string;
  role: string;
  hour: number | null;
}

const ALLOCATIONS: CoachAllocation[] = [
  { coach_name: "Alex Thornhill", date: "2026-04-14", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-04-14", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Ritin Rahman", date: "2026-04-14", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Luca Vander Sluys", date: "2026-04-14", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Alex Thornhill", date: "2026-04-14", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-04-14", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Ritin Rahman", date: "2026-04-14", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Luca Vander Sluys", date: "2026-04-14", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Adelaide Campion", date: "2026-04-16", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Zac M", date: "2026-04-16", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Matt Gome", date: "2026-04-16", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Ikroop Dhanoa", date: "2026-04-16", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Adelaide Campion", date: "2026-04-16", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Zac M", date: "2026-04-16", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Matt Gome", date: "2026-04-16", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Ikroop Dhanoa", date: "2026-04-16", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Adam Drinkwell", date: "2026-04-18", start_time: "08:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-04-18", start_time: "08:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Ritin Rahman", date: "2026-04-18", start_time: "08:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Shenan Dias", date: "2026-04-18", start_time: "08:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Adam Drinkwell", date: "2026-04-18", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-04-18", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Luca Vander Sluys", date: "2026-04-18", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Ikroop Dhanoa", date: "2026-04-18", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Adam Drinkwell", date: "2026-04-18", start_time: "16:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-04-18", start_time: "16:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Luca Vander Sluys", date: "2026-04-18", start_time: "16:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Shenan Dias", date: "2026-04-18", start_time: "16:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Adelaide Campion", date: "2026-04-19", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Alex Thornhill", date: "2026-04-19", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Matt Gome", date: "2026-04-19", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Shenan Dias", date: "2026-04-19", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Alex Thornhill", date: "2026-04-21", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-04-21", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Ritin Rahman", date: "2026-04-21", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Luca Vander Sluys", date: "2026-04-21", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Jarryd Rodgers", date: "2026-04-21", start_time: "17:00:00", coach_role: "specialist", role: "guest_coach", hour: 2 },
  { coach_name: "Alex Thornhill", date: "2026-04-21", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-04-21", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Ritin Rahman", date: "2026-04-21", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Luca Vander Sluys", date: "2026-04-21", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Jarryd Rodgers", date: "2026-04-21", start_time: "19:00:00", coach_role: "specialist", role: "guest_coach", hour: 1 },
  { coach_name: "Adelaide Campion", date: "2026-04-23", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Zac M", date: "2026-04-23", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Matt Gome", date: "2026-04-23", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Ikroop Dhanoa", date: "2026-04-23", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Jarryd Rodgers", date: "2026-04-23", start_time: "17:00:00", coach_role: "specialist", role: "guest_coach", hour: 2 },
  { coach_name: "Adelaide Campion", date: "2026-04-23", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Zac M", date: "2026-04-23", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Matt Gome", date: "2026-04-23", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Ikroop Dhanoa", date: "2026-04-23", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Jarryd Rodgers", date: "2026-04-23", start_time: "19:00:00", coach_role: "specialist", role: "guest_coach", hour: 1 },
  { coach_name: "Adam Drinkwell", date: "2026-04-25", start_time: "08:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-04-25", start_time: "08:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Ritin Rahman", date: "2026-04-25", start_time: "08:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Shenan Dias", date: "2026-04-25", start_time: "08:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Adam Drinkwell", date: "2026-04-25", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-04-25", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Luca Vander Sluys", date: "2026-04-25", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Ikroop Dhanoa", date: "2026-04-25", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Alex Thornhill", date: "2026-04-25", start_time: "16:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-04-25", start_time: "16:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Luca Vander Sluys", date: "2026-04-25", start_time: "16:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Shenan Dias", date: "2026-04-25", start_time: "16:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Adelaide Campion", date: "2026-04-26", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Alex Thornhill", date: "2026-04-26", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Matt Gome", date: "2026-04-26", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Shenan Dias", date: "2026-04-26", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Alex Thornhill", date: "2026-04-28", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-04-28", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Ritin Rahman", date: "2026-04-28", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Luca Vander Sluys", date: "2026-04-28", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Jarryd Rodgers", date: "2026-04-28", start_time: "17:00:00", coach_role: "specialist", role: "guest_coach", hour: 2 },
  { coach_name: "Alex Thornhill", date: "2026-04-28", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-04-28", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Ritin Rahman", date: "2026-04-28", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Luca Vander Sluys", date: "2026-04-28", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Jarryd Rodgers", date: "2026-04-28", start_time: "19:00:00", coach_role: "specialist", role: "guest_coach", hour: 1 },
  { coach_name: "Adelaide Campion", date: "2026-04-30", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Zac M", date: "2026-04-30", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Matt Gome", date: "2026-04-30", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Ikroop Dhanoa", date: "2026-04-30", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Jarryd Rodgers", date: "2026-04-30", start_time: "17:00:00", coach_role: "specialist", role: "guest_coach", hour: 2 },
  { coach_name: "Adelaide Campion", date: "2026-04-30", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Zac M", date: "2026-04-30", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Matt Gome", date: "2026-04-30", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Ikroop Dhanoa", date: "2026-04-30", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Jarryd Rodgers", date: "2026-04-30", start_time: "19:00:00", coach_role: "specialist", role: "guest_coach", hour: 1 },
  { coach_name: "Adam Drinkwell", date: "2026-05-02", start_time: "08:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-05-02", start_time: "08:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Ritin Rahman", date: "2026-05-02", start_time: "08:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Shenan Dias", date: "2026-05-02", start_time: "08:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Adam Drinkwell", date: "2026-05-02", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-05-02", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Luca Vander Sluys", date: "2026-05-02", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Ikroop Dhanoa", date: "2026-05-02", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Alex Thornhill", date: "2026-05-02", start_time: "16:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-05-02", start_time: "16:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Luca Vander Sluys", date: "2026-05-02", start_time: "16:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Shenan Dias", date: "2026-05-02", start_time: "16:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Adelaide Campion", date: "2026-05-03", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Alex Thornhill", date: "2026-05-03", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Matt Gome", date: "2026-05-03", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Shenan Dias", date: "2026-05-03", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Alex Thornhill", date: "2026-05-05", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-05-05", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Ritin Rahman", date: "2026-05-05", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Luca Vander Sluys", date: "2026-05-05", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Jarryd Rodgers", date: "2026-05-05", start_time: "17:00:00", coach_role: "specialist", role: "guest_coach", hour: 2 },
  { coach_name: "Alex Thornhill", date: "2026-05-05", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-05-05", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Ritin Rahman", date: "2026-05-05", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Luca Vander Sluys", date: "2026-05-05", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Jarryd Rodgers", date: "2026-05-05", start_time: "19:00:00", coach_role: "specialist", role: "guest_coach", hour: 1 },
  { coach_name: "Adelaide Campion", date: "2026-05-07", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Zac M", date: "2026-05-07", start_time: "17:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Matt Gome", date: "2026-05-07", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Ikroop Dhanoa", date: "2026-05-07", start_time: "17:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Jarryd Rodgers", date: "2026-05-07", start_time: "17:00:00", coach_role: "specialist", role: "guest_coach", hour: 2 },
  { coach_name: "Adelaide Campion", date: "2026-05-07", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Zac M", date: "2026-05-07", start_time: "19:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Matt Gome", date: "2026-05-07", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Ikroop Dhanoa", date: "2026-05-07", start_time: "19:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Jarryd Rodgers", date: "2026-05-07", start_time: "19:00:00", coach_role: "specialist", role: "guest_coach", hour: 1 },
  { coach_name: "Adam Drinkwell", date: "2026-05-09", start_time: "08:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-05-09", start_time: "08:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Ritin Rahman", date: "2026-05-09", start_time: "08:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Shenan Dias", date: "2026-05-09", start_time: "08:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Adam Drinkwell", date: "2026-05-09", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-05-09", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Luca Vander Sluys", date: "2026-05-09", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Ikroop Dhanoa", date: "2026-05-09", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Alex Thornhill", date: "2026-05-09", start_time: "16:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Glenn Butterworth", date: "2026-05-09", start_time: "16:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Luca Vander Sluys", date: "2026-05-09", start_time: "16:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Shenan Dias", date: "2026-05-09", start_time: "16:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
  { coach_name: "Adelaide Campion", date: "2026-05-10", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Alex Thornhill", date: "2026-05-10", start_time: "14:00:00", coach_role: "squad_coach", role: "assistant_coach", hour: null },
  { coach_name: "Matt Gome", date: "2026-05-10", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 1 },
  { coach_name: "Shenan Dias", date: "2026-05-10", start_time: "14:00:00", coach_role: "assistant", role: "assistant_coach", hour: 2 },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Step 1: Fetch all coaches (name -> id mapping)
    const { data: coachesData, error: coachesError } = await supabase
      .from("sp_coaches")
      .select("id, name");

    if (coachesError) {
      console.error("Error fetching coaches:", coachesError);
      return NextResponse.json(
        { error: "Failed to fetch coaches", details: coachesError.message },
        { status: 500 }
      );
    }

    const coachMap = new Map<string, string>();
    if (coachesData) {
      coachesData.forEach((coach: { id: string; name: string }) => {
        coachMap.set(coach.name, coach.id);
      });
    }

    // Step 2: Fetch all sessions (date + start_time -> id mapping)
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("sp_sessions")
      .select("id, date, start_time");

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch sessions", details: sessionsError.message },
        { status: 500 }
      );
    }

    const sessionMap = new Map<string, string>();
    if (sessionsData) {
      sessionsData.forEach((session: { id: string; date: string; start_time: string }) => {
        const key = `${session.date}|${session.start_time}`;
        sessionMap.set(key, session.id);
      });
    }

    // Step 3: Delete all existing rows from sp_session_coaches
    const { error: deleteError } = await supabase
      .from("sp_session_coaches")
      .delete()
      .neq("id", "");

    if (deleteError) {
      console.error("Error deleting existing session coaches:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete existing session coaches", details: deleteError.message },
        { status: 500 }
      );
    }

    // Step 4: Insert the 140 coach allocations
    const rowsToInsert = ALLOCATIONS
      .map((allocation) => {
        const coachId = coachMap.get(allocation.coach_name);
        const sessionKey = `${allocation.date}|${allocation.start_time}`;
        const sessionId = sessionMap.get(sessionKey);

        if (!coachId) {
          console.warn(`Coach not found: ${allocation.coach_name}`);
          return null;
        }

        if (!sessionId) {
          console.warn(`Session not found: ${allocation.date} ${allocation.start_time}`);
          return null;
        }

        return {
          session_id: sessionId,
          coach_id: coachId,
          coach_role: allocation.coach_role,
          role: allocation.role,
          hour: allocation.hour,
          confirmed: true,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (rowsToInsert.length === 0) {
      return NextResponse.json(
        { error: "No valid allocations could be created - check coach and session mappings" },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase
      .from("sp_session_coaches")
      .insert(rowsToInsert);

    if (insertError) {
      console.error("Error inserting session coaches:", insertError);
      return NextResponse.json(
        { error: "Failed to insert session coaches", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inserted_count: rowsToInsert.length,
      message: `Successfully seeded ${rowsToInsert.length} coach allocations`,
    });
  } catch (error) {
    console.error("Seed coaches error:", error);
    return NextResponse.json(
      { error: "Failed to seed coaches", details: String(error) },
      { status: 500 }
    );
  }
}
