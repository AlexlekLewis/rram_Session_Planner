"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { CoachAvailability, SessionCoach, AvailabilityStatus } from "@/lib/types";

// Coach record from sp_coaches table
export interface CoachRecord {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  role: string;
  speciality?: string;
  bio?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

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
  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const coachesRef = useRef<CoachRecord[]>([]);
  const [availability, setAvailability] = useState<CoachAvailability[]>([]);
  const [sessionCoaches, setSessionCoaches] = useState<SessionCoach[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all active coaches from sp_coaches
  const fetchCoaches = useCallback(async () => {
    const { data, error } = await supabase
      .from("sp_coaches")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      const records = data as CoachRecord[];
      coachesRef.current = records;
      setCoaches(records);
    }
  }, []);

  // Fetch availability for a set of sessions (batched to avoid URL length limits)
  const fetchAvailability = useCallback(async () => {
    if (!programId || !sessionIds || sessionIds.length === 0) return;

    const BATCH_SIZE = 25;
    const allData: CoachAvailability[] = [];

    for (let i = 0; i < sessionIds.length; i += BATCH_SIZE) {
      const batch = sessionIds.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from("sp_coach_availability")
        .select("*")
        .eq("program_id", programId)
        .in("session_id", batch);

      if (!error && data) {
        allData.push(...(data as CoachAvailability[]));
      }
    }

    setAvailability(allData);
  }, [programId, sessionIds]);

  // Helper: map raw sp_session_coaches rows and enrich with coach lookup
  const mapSessionCoachRows = useCallback(
    (rows: Record<string, unknown>[], coachLookup: Map<string, CoachRecord>) => {
      return rows.map((row) => {
        const cId = row.coach_id as string | undefined;
        const coach = cId ? coachLookup.get(cId) : undefined;
        return {
          id: row.id as string,
          session_id: row.session_id as string,
          user_id: row.user_id as string | undefined,
          coach_id: cId,
          role: row.role as string,
          coach_role: (row.coach_role || "assistant") as SessionCoach["coach_role"],
          hour: row.hour as number | undefined,
          confirmed: row.confirmed as boolean,
          notes: row.notes as string | undefined,
          created_at: row.created_at as string,
          coach_name: coach?.name,
          coach_speciality: coach?.speciality,
          coach_email: coach?.email,
        } satisfies SessionCoach;
      });
    },
    []
  );

  // Fetch coaches rostered to a specific session
  const fetchSessionCoaches = useCallback(async () => {
    if (!sessionId) return;
    const { data, error } = await supabase
      .from("sp_session_coaches")
      .select("*")
      .eq("session_id", sessionId);

    if (!error && data) {
      const coachLookup = new Map(coachesRef.current.map((c) => [c.id, c]));
      setSessionCoaches(mapSessionCoachRows(data as Record<string, unknown>[], coachLookup));
    }
  }, [sessionId, mapSessionCoachRows]);

  // Fetch all session coaches for multiple sessions (for the roster table)
  // Batches the .in() query to avoid URL length limits with many session IDs
  const fetchAllSessionCoaches = useCallback(async () => {
    if (!sessionIds || sessionIds.length === 0) return;

    const BATCH_SIZE = 25;
    const allRows: Record<string, unknown>[] = [];

    for (let i = 0; i < sessionIds.length; i += BATCH_SIZE) {
      const batch = sessionIds.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from("sp_session_coaches")
        .select("*")
        .in("session_id", batch);

      if (!error && data) {
        allRows.push(...(data as Record<string, unknown>[]));
      }
    }

    const coachLookup = new Map(coachesRef.current.map((c) => [c.id, c]));
    setSessionCoaches(mapSessionCoachRows(allRows, coachLookup));
  }, [sessionIds, mapSessionCoachRows]);

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
        setAvailability((prev) => {
          const existing = prev.findIndex(
            (a) => a.user_id === userId && a.session_id === targetSessionId
          );
          const record: CoachAvailability = {
            id: existing >= 0 ? prev[existing].id : crypto.randomUUID(),
            program_id: programId,
            session_id: targetSessionId,
            user_id: userId,
            date: "",
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
    async (
      targetSessionId: string,
      coachId: string,
      coachRole: string = "assistant",
      hour?: number
    ) => {
      const { error } = await supabase.from("sp_session_coaches").insert({
        session_id: targetSessionId,
        coach_id: coachId,
        coach_role: coachRole,
        role: coachRole === "specialist" ? "guest_coach" : "assistant_coach",
        hour: hour ?? null,
        confirmed: true,
      });
      if (!error) {
        await fetchSessionCoaches();
      }
      return error;
    },
    [fetchSessionCoaches]
  );

  // Remove a coach from a session
  const unrosterCoach = useCallback(async (targetSessionId: string, coachId: string) => {
    const { error } = await supabase
      .from("sp_session_coaches")
      .delete()
      .eq("session_id", targetSessionId)
      .eq("coach_id", coachId);
    if (!error) {
      setSessionCoaches((prev) => prev.filter((sc) => sc.coach_id !== coachId));
    }
    return error;
  }, []);

  // Update a coach profile in sp_coaches
  const updateCoachProfile = useCallback(
    async (coachId: string, updates: Partial<Pick<CoachRecord, "name" | "speciality" | "email" | "bio">>) => {
      const { error } = await supabase.from("sp_coaches").update(updates).eq("id", coachId);
      if (!error) {
        setCoaches((prev) =>
          prev.map((c) => (c.id === coachId ? { ...c, ...updates } : c))
        );
      }
      return error;
    },
    []
  );

  // Get session coaches grouped by role for a given session
  const getSessionCoachesByRole = useCallback(
    (targetSessionId: string) => {
      const forSession = sessionCoaches.filter((sc) => sc.session_id === targetSessionId);
      return {
        squadCoaches: forSession.filter((sc) => sc.coach_role === "squad_coach"),
        assistants: forSession.filter((sc) => sc.coach_role === "assistant"),
        specialists: forSession.filter((sc) => sc.coach_role === "specialist"),
      };
    },
    [sessionCoaches]
  );

  // Initial fetch — coaches must load first so session coach lookups can resolve names
  useEffect(() => {
    setLoading(true);
    fetchCoaches()
      .then(() => Promise.all([fetchAvailability(), fetchSessionCoaches(), fetchAllSessionCoaches()]))
      .finally(() => setLoading(false));
  }, [fetchCoaches, fetchAvailability, fetchSessionCoaches, fetchAllSessionCoaches]);

  return {
    coaches,
    availability,
    sessionCoaches,
    loading,
    setCoachAvailability,
    rosterCoach,
    unrosterCoach,
    updateCoachProfile,
    getSessionCoachesByRole,
    refetchCoaches: fetchCoaches,
    refetchAvailability: fetchAvailability,
    refetchSessionCoaches: fetchSessionCoaches,
  };
}
