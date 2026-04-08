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
 * Resolution order:
 * 1. If programId is provided, look up sp_program_members for that program
 * 2. Fall back to sp_coaches (legacy, pre-multi-program)
 * 3. Default to "player" if no records found
 *
 * The programId parameter is optional for backward compatibility.
 * When ProgramProvider is wired in, pass activeProgram.id here.
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
        if (programId) {
          const { data: membership } = await supabase
            .from("sp_program_members")
            .select("role")
            .eq("user_id", user.id)
            .eq("program_id", programId)
            .eq("status", "active")
            .single();

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
          // If no program membership, fall through to legacy
        }

        // Strategy 2: Legacy sp_coaches lookup
        const { data: coach } = await supabase
          .from("sp_coaches")
          .select("name, role")
          .or(`email.eq.${email},user_id.eq.${user.id}`)
          .single();

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
