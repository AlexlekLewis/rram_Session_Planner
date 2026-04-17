"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/lib/types";

interface UserRoleState {
  role: UserRole;
  isAdmin: boolean;
  isCoach: boolean;
  isPlayer: boolean;
  userName: string;
  userEmail: string;
  isLoading: boolean;
}

/**
 * useUserRole — resolves the current user's role.
 *
 * Resolution order (post-C2 audit fix):
 * 1. If programId is provided, look up sp_program_members for that program.
 * 2. If programId is NOT provided, fall back to sp_coaches (no-program-context
 *    surfaces only — e.g. landing page, super-admin selectors).
 * 3. Default to "player" if no records found.
 *
 * BREAKING (C2): when programId IS provided, there is no longer an implicit
 * fallback to sp_coaches. A user without an active sp_program_members row for
 * that program resolves as "player". This prevents cross-program privilege
 * escalation via the legacy global table. Coaches must be enrolled in
 * sp_program_members for every program they need access to.
 */
export function useUserRole(programId?: string): UserRoleState {
  const [state, setState] = useState<UserRoleState>({
    role: "player",
    isAdmin: false,
    isCoach: false,
    isPlayer: true,
    userName: "",
    userEmail: "",
    isLoading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          setState((s) => ({ ...s, isLoading: false }));
          return;
        }

        const email = user.email;

        // Strategy 1: Program-scoped lookup (if programId provided)
        // C2 FIX: .maybeSingle() instead of .single() so zero rows do not throw.
        // C2 FIX: no implicit fallback to sp_coaches when programId is set.
        if (programId) {
          const { data: membership, error: membershipError } = await supabase
            .from("sp_program_members")
            .select("role")
            .eq("user_id", user.id)
            .eq("program_id", programId)
            .eq("status", "active")
            .maybeSingle();

          if (membershipError) throw membershipError;

          if (membership) {
            const role = membership.role as UserRole;
            setState({
              role,
              isAdmin: role === "head_coach",
              isCoach: role !== "player",
              isPlayer: role === "player",
              userName: email.split("@")[0],
              userEmail: email,
              isLoading: false,
            });
            return;
          }

          // C2 FIX: No fallback when programId is provided. Default to player.
          setState({
            role: "player",
            isAdmin: false,
            isCoach: false,
            isPlayer: true,
            userName: email.split("@")[0],
            userEmail: email,
            isLoading: false,
          });
          return;
        }

        // Strategy 2: Legacy sp_coaches lookup — ONLY when programId is not supplied.
        // Used by no-program-context surfaces (landing page, super-admin selectors).
        const { data: coach, error: coachError } = await supabase
          .from("sp_coaches")
          .select("name, role")
          .or(`email.eq.${email},user_id.eq.${user.id}`)
          .maybeSingle();

        if (coachError) throw coachError;

        if (coach) {
          const role = coach.role as UserRole;
          setState({
            role,
            isAdmin: role === "head_coach",
            isCoach: role !== "player",
            isPlayer: role === "player",
            userName: coach.name,
            userEmail: email,
            isLoading: false,
          });
          return;
        }

        // Default: player
        setState({
          role: "player",
          isAdmin: false,
          isCoach: false,
          isPlayer: true,
          userName: email.split("@")[0],
          userEmail: email,
          isLoading: false,
        });
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    };

    fetchRole();
  }, [programId]);

  return state;
}
