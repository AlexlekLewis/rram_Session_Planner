"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { Program, ProgramMember, UserRole } from "@/lib/types";

/**
 * Program Context — Multi-Program Support
 *
 * Manages which program the user is currently viewing/editing.
 * All data hooks downstream should read `activeProgram` from this context
 * and scope their queries accordingly.
 *
 * On mount:
 *  1. Fetches the user's program memberships from sp_program_members
 *  2. Fetches the associated programs
 *  3. Sets the active program (from localStorage or first available)
 *
 * When switched:
 *  - Updates localStorage for persistence across reloads
 *  - All child components re-render with new program context
 *
 * PATTERN: React Context with state (needs to trigger re-renders on switch)
 */

const STORAGE_KEY = "rra-active-program-id";

interface ProgramContextValue {
  /** All programs the user is a member of */
  programs: Program[];
  /** The currently active program (null during loading) */
  activeProgram: Program | null;
  /** The user's role within the active program */
  role: UserRole;
  /** Whether the user is a head_coach in the active program */
  isAdmin: boolean;
  /** Whether the user can edit (head_coach or assistant_coach) in the active program */
  canEdit: boolean;
  /** Whether the user is a coach (not a player) in the active program */
  isCoach: boolean;
  /** The user's membership record for the active program */
  membership: ProgramMember | null;
  /** All memberships for the user across programs */
  memberships: ProgramMember[];
  /** Switch to a different program by ID */
  setActiveProgram: (programId: string) => void;
  /** Whether program data is still loading */
  isLoading: boolean;
  /** Refresh program data (after creating/joining a program) */
  refreshPrograms: () => Promise<void>;
}

const ProgramContext = createContext<ProgramContextValue>({
  programs: [],
  activeProgram: null,
  role: "player",
  isAdmin: false,
  canEdit: false,
  isCoach: false,
  membership: null,
  memberships: [],
  setActiveProgram: () => {},
  isLoading: true,
  refreshPrograms: async () => {},
});

export function ProgramProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [memberships, setMemberships] = useState<ProgramMember[]>([]);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrograms = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch user's memberships
      const { data: memberData, error: memberError } = await supabase
        .from("sp_program_members")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (memberError) {
        // Table might not exist yet (migration not applied)
        // Fall back to legacy sp_coaches lookup
        console.warn("sp_program_members not available, falling back to legacy:", memberError.message);
        await fallbackToLegacy(user.id, user.email ?? "");
        return;
      }

      if (!memberData || memberData.length === 0) {
        // User has no memberships — try legacy fallback
        await fallbackToLegacy(user.id, user.email ?? "");
        return;
      }

      setMemberships(memberData as ProgramMember[]);

      // Fetch the associated programs
      const programIds = (memberData as ProgramMember[]).map((m) => m.program_id);
      const { data: progData } = await supabase
        .from("sp_programs")
        .select("*")
        .in("id", programIds)
        .order("created_at", { ascending: true });

      const progs = (progData || []) as Program[];
      setPrograms(progs);

      // Restore last active program from localStorage, or use first
      const stored = localStorage.getItem(STORAGE_KEY);
      const validStored = stored && progs.some((p) => p.id === stored);
      setActiveProgramId(validStored ? stored! : progs[0]?.id ?? null);
    } catch (err) {
      console.error("Failed to load programs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  /**
   * Legacy fallback: if sp_program_members doesn't exist or user has no records,
   * fall back to the old sp_coaches table and load all programs.
   * This ensures backward compatibility before migration 014 is applied.
   */
  const fallbackToLegacy = useCallback(
    async (userId: string, email: string) => {
      const { data: coach } = await supabase
        .from("sp_coaches")
        .select("role")
        .or(`user_id.eq.${userId},email.eq.${email}`)
        .eq("is_active", true)
        .limit(1)
        .single();

      // Load all programs (legacy behavior — single program)
      const { data: progData } = await supabase
        .from("sp_programs")
        .select("*")
        .order("created_at", { ascending: true });

      const progs = (progData || []) as Program[];
      setPrograms(progs);

      if (coach && progs.length > 0) {
        // Create a synthetic membership for the legacy coach
        const syntheticMembership: ProgramMember = {
          id: "legacy",
          program_id: progs[0].id,
          user_id: userId,
          role: coach.role as UserRole,
          invited_at: new Date().toISOString(),
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMemberships([syntheticMembership]);
        setActiveProgramId(progs[0].id);
      } else {
        // No coach record either — default to player
        if (progs.length > 0) {
          const syntheticMembership: ProgramMember = {
            id: "legacy-player",
            program_id: progs[0].id,
            user_id: userId,
            role: "player",
            invited_at: new Date().toISOString(),
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setMemberships([syntheticMembership]);
          setActiveProgramId(progs[0].id);
        }
      }
      setIsLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const setActiveProgram = useCallback(
    (programId: string) => {
      if (programs.some((p) => p.id === programId)) {
        setActiveProgramId(programId);
        localStorage.setItem(STORAGE_KEY, programId);
      }
    },
    [programs]
  );

  const value = useMemo<ProgramContextValue>(() => {
    const activeProgram = programs.find((p) => p.id === activeProgramId) ?? null;
    const membership =
      memberships.find((m) => m.program_id === activeProgramId) ?? null;
    const role: UserRole = membership?.role ?? "player";

    return {
      programs,
      activeProgram,
      role,
      isAdmin: role === "head_coach",
      canEdit: role === "head_coach" || role === "assistant_coach",
      isCoach: role !== "player",
      membership,
      memberships,
      setActiveProgram,
      isLoading,
      refreshPrograms: fetchPrograms,
    };
  }, [
    programs,
    activeProgramId,
    memberships,
    setActiveProgram,
    isLoading,
    fetchPrograms,
  ]);

  return (
    <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
  );
}

export function useProgram() {
  return useContext(ProgramContext);
}
