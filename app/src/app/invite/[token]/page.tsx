"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProgramInvite, UserRole } from "@/lib/types";
import { Check, X, Loader2 } from "lucide-react";

const ROLE_LABELS: Record<UserRole, string> = {
  head_coach: "Head Coach",
  assistant_coach: "Assistant Coach",
  guest_coach: "Guest Coach",
  player: "Player",
};

type InviteState = "loading" | "ready" | "accepting" | "accepted" | "expired" | "error";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [state, setState] = useState<InviteState>("loading");
  const [invite, setInvite] = useState<ProgramInvite | null>(null);
  const [programName, setProgramName] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadInvite = async () => {
      // Check auth status
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      // Look up the invite
      const { data, error: fetchError } = await supabase
        .from("sp_program_invites")
        .select("*")
        .eq("token", token)
        .is("accepted_at", null)
        .single();

      if (fetchError || !data) {
        setState("expired");
        return;
      }

      const inv = data as ProgramInvite;

      // Check expiry
      if (new Date(inv.expires_at) < new Date()) {
        setState("expired");
        return;
      }

      setInvite(inv);

      // Fetch program name
      const { data: prog } = await supabase
        .from("sp_programs")
        .select("name")
        .eq("id", inv.program_id)
        .single();

      setProgramName(prog?.name ?? "Unknown Program");
      setState("ready");
    };

    loadInvite();
  }, [supabase, token]);

  const handleAccept = async () => {
    if (!invite) return;
    setState("accepting");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/invite/${token}`);
      return;
    }

    // Create program membership
    const { error: memberError } = await supabase
      .from("sp_program_members")
      .insert({
        program_id: invite.program_id,
        user_id: user.id,
        role: invite.role,
        status: "active",
        accepted_at: new Date().toISOString(),
      });

    if (memberError) {
      if (memberError.code === "23505") {
        // Already a member — that's fine
      } else {
        setState("error");
        setError(memberError.message);
        return;
      }
    }

    // Mark invite as accepted
    await supabase
      .from("sp_program_invites")
      .update({
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    setState("accepted");

    // Redirect to dashboard after short delay
    setTimeout(() => {
      router.push("/dashboard/month");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        {state === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-rr-blue animate-spin" />
            <p className="text-sm text-gray-500">Loading invite...</p>
          </div>
        )}

        {state === "expired" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-rr-charcoal dark:text-white">
              Invite Expired
            </h2>
            <p className="text-sm text-gray-500">
              This invite link is no longer valid. Ask the program administrator for a new one.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 px-6 py-2 text-sm font-semibold text-white bg-rr-blue rounded-lg hover:bg-rr-blue/90 transition"
            >
              Go to Login
            </button>
          </div>
        )}

        {state === "ready" && invite && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rr-blue/10 flex items-center justify-center">
              <span className="text-xl">🏏</span>
            </div>
            <h2 className="text-lg font-bold text-rr-charcoal dark:text-white">
              You&apos;re Invited!
            </h2>
            <p className="text-sm text-gray-500">
              You&apos;ve been invited to join <strong className="text-rr-charcoal dark:text-white">{programName}</strong> as a{" "}
              <strong className="text-rr-blue">{ROLE_LABELS[invite.role]}</strong>.
            </p>

            {!isAuthenticated && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                You&apos;ll need to sign in or create an account first.
              </p>
            )}

            <button
              onClick={handleAccept}
              className="mt-2 w-full px-6 py-3 text-sm font-semibold text-white bg-rr-blue rounded-lg hover:bg-rr-blue/90 transition"
            >
              {isAuthenticated ? "Accept Invite" : "Sign In & Accept"}
            </button>
          </div>
        )}

        {state === "accepting" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-rr-blue animate-spin" />
            <p className="text-sm text-gray-500">Joining program...</p>
          </div>
        )}

        {state === "accepted" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-lg font-bold text-rr-charcoal dark:text-white">
              Welcome!
            </h2>
            <p className="text-sm text-gray-500">
              You&apos;ve joined <strong>{programName}</strong>. Redirecting to dashboard...
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-rr-charcoal dark:text-white">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={() => setState("ready")}
              className="mt-4 px-6 py-2 text-sm font-semibold text-white bg-rr-blue rounded-lg hover:bg-rr-blue/90 transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
