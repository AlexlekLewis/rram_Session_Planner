"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProgramMember, CoachAvailability, SessionCoach, AvailabilityStatus } from "@/lib/types";

interface UseCoachesOptions {
  programId?: string;
  dateRange?: { start: string; end: string };
  sessionId?: string;
}

export function useCoaches({ programId, dateRange, sessionId }: UseCoachesOptions = {}) {
  const supabase = createClient();
  const [coaches, setCoaches] = useState<ProgramMember[]>([]);
  const [availability, setAvailability] = useState<CoachAvailability[]>([]);
  const [sessionCoaches, setSessionCoaches] = useState<SessionCoach[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all coach-role members for the program
  const fetchCoaches = useCallback(async () => {
    if (!programId) return;
    const { data, error } = await supabase
      .from("sp_program_members")
      .select("*")
      .eq("program_id", programId)
      .eq("status", "active")
      .in("role", ["head_coach", "assistant_coach", "guest_coach"])
      .order("role");

    if (!error && data) {
      setCoaches(data as ProgramMember[]);
    }
  }, [supabase, programId]);

  // Fetch availability for date range
  const fetchAvailability = useCallback(async () => {
    if (!programId || !dateRange) return;
    const { data, error } = await supabase
      .from("sp_coach_availability")
      .select("*")
      .eq("program_id", programId)
      .gte("date", dateRange.start)
      .lte("date", dateRange.end);

    if (!error && data) {
      setAvailability(data as CoachAvailability[]);
    }
  }, [supabase, programId, dateRange]);

  // Fetch coaches rostered to a specific session
  const fetchSessionCoaches = useCallback(async () => {
    if (!sessionId) return;
    const { data, error } = await supabase
      .from("sp_session_coaches")
      .select("*")
      .eq("session_id", sessionId);

    if (!error && data) {
      setSessionCoaches(data as SessionCoach[]);
    }
  }, [supabase, sessionId]);

  // Set availability for a coach on a date
  const setCoachAvailability = useCallback(
    async (userId: string, date: string, status: AvailabilityStatus, notes?: string) => {
      if (!programId) return;
      const { error } = await supabase
        .from("sp_coach_availability")
        .upsert(
          {
            program_id: programId,
            user_id: userId,
            date,
            status,
            notes: notes ?? null,
          },
          { onConflict: "program_id,user_id,date" }
        );

      if (!error) {
        // Optimistic update
        setAvailability((prev) => {
          const existing = prev.findIndex(
            (a) => a.user_id === userId && a.date === date
          );
          const record: CoachAvailability = {
            id: existing >= 0 ? prev[existing].id : crypto.randomUUID(),
            program_id: programId,
            user_id: userId,
            date,
            status,
            notes: notes ?? undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = record;
            return updated;
          }
          return [...prev, record];
        });
      }
      return error;
    },
    [supabase, programId]
  );

  // Roster a coach onto a session
  const rosterCoach = useCallback(
    async (targetSessionId: string, userId: string, role: string = "assistant_coach") => {
      const { error } = await supabase
        .from("sp_session_coaches")
        .upsert(
          { session_id: targetSessionId, user_id: userId, role },
          { onConflict: "session_id,user_id" }
        );
      if (!error) {
        await fetchSessionCoaches();
      }
      return error;
    },
    [supabase, fetchSessionCoaches]
  );

  // Remove a coach from a session
  const unrosterCoach = useCallback(
    async (targetSessionId: string, userId: string) => {
      const { error } = await supabase
        .from("sp_session_coaches")
        .delete()
        .eq("session_id", targetSessionId)
        .eq("user_id", userId);
      if (!error) {
        setSessionCoaches((prev) => prev.filter((sc) => sc.user_id !== userId));
      }
      return error;
    },
    [supabase]
  );

  // Update a coach's profile (display_name, phone, speciality)
  const updateCoachProfile = useCallback(
    async (memberId: string, updates: Partial<Pick<ProgramMember, "display_name" | "phone" | "speciality">>) => {
      const { error } = await supabase
        .from("sp_program_members")
        .update(updates)
        .eq("id", memberId);

      if (!error) {
        setCoaches((prev) =>
          prev.map((c) => (c.id === memberId ? { ...c, ...updates } : c))
        );
      }
      return error;
    },
    [supabase]
  );

  // Get availability for a specific coach on a specific date
  const getCoachAvailabilityForDate = useCallback(
    (userId: string, date: string): AvailabilityStatus | null => {
      const record = availability.find(
        (a) => a.user_id === userId && a.date === date
      );
      return record?.status ?? null;
    },
    [availability]
  );

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCoaches(), fetchAvailability(), fetchSessionCoaches()]).finally(
      () => setLoading(false)
    );
  }, [fetchCoaches, fetchAvailability, fetchSessionCoaches]);

  return {
    coaches,
    availability,
    sessionCoaches,
    loading,
    setCoachAvailability,
    rosterCoach,
    unrosterCoach,
    updateCoachProfile,
    getCoachAvailabilityForDate,
    refetchCoaches: fetchCoaches,
    refetchAvailability: fetchAvailability,
    refetchSessionCoaches: fetchSessionCoaches,
  };
}
