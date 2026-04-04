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

// Admin emails that always get head_coach access
const ADMIN_EMAILS = [
  "alex.lewis@rramelbourne.com",
  "alex.lewis@rradna.app",
  "alexleklewis@gmail.com",
];

export function useUserRole(): UserRoleState {
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

        // Check if admin email
        if (ADMIN_EMAILS.includes(email.toLowerCase())) {
          setState({
            role: "head_coach",
            isAdmin: true,
            isCoach: true,
            isPlayer: false,
            userName: "Alex Lewis",
            userEmail: email,
            isLoading: false,
          });
          return;
        }

        // Try to match against sp_coaches by email or user_id
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
  }, []);

  return state;
}
