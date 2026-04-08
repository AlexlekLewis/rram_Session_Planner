"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProgramMember, CoachAvailability, SessionCoach, AvailabilityStatus } from "@/lib/types";

interface UseCoachesOptions {
  programId?: string;
  /** Session IDs to fetch availability for */
  sessionIds?: string[];
  /** Single session ID for roster queries */
  sessionId?: string;
}

export function useCoaches({ programId, sessionIds, sessionId }: UseCoachesOptions = {}) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
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
  }, [programId]);

  // Fetch availability for a set of sessions
  const fetchAvailability = useCallback(async () => {
    if (!programId || !sessionIds || sessionIds.length === 0) return;
    const { data, error } = await supabase
      .from("sp_coach_availability")
      .select("*")
      .eq("program_id", programId)
      .in("session_id", sessionIds);

    if (!error && data) {
      setAvailability(data as CoachAvailability[]);
    }
  }, [programId, sessionIds]);

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
  }, [sessionId]);

  // Set availability for a coach on a specific session
  const setCoachAvailability = useCallback(
    async (userId: string, targetSessionId: string, status: AvailabilityStatus, notes?: string) => {
      if (!programId) return;
      const { error } = await supabase
        .from("sp_coach_availability")
        .upsert(
          {
            program_id: programId,
            session_id: targetSessionId,
            user_id: userId,
            status,
            notes: notes ?? null,
          },
          { onConflict: "session_id,user_id" }
        );

      if (!error) {
        // Optimistic update
        setAvailability((prev) => {
          const existing = prev.findIndex(
            (a) => a.user_id === userId && a.session_id === targetSessionId
          );
          const record: CoachAvailability = {
            id: existing >= 0 ? prev[existing].id : crypto.randomUUID(),
            program_id: programId,
            session_id: targetSessionId,
            user_id: userId,
            date: "", // Auto-populated by DB trigger
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
    [programId]
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
    [fetchSessionCoaches]
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
    []
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
    []
  );

  // Get availability for a specific coach on a specific session
  const getCoachAvailabilityForSession = useCallback(
    (userId: string, targetSessionId: string): AvailabilityStatus | null => {
      const record = availability.find(
        (a) => a.user_id === userId && a.session_id === targetSessionId
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
    getCoachAvailabilityForSession,
    refetchCoaches: fetchCoaches,
    refetchAvailability: fetchAvailability,
    refetchSessionCoaches: fetchSessionCoaches,
  };
}
