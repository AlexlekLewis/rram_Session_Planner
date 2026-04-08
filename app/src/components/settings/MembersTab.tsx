"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProgram } from "@/lib/program-context";
import { ProgramMember, ProgramInvite, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Trash2, Copy, Check, Clock, UserPlus } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<UserRole, string> = {
  head_coach: "Head Coach",
  assistant_coach: "Assistant Coach",
  guest_coach: "Guest Coach",
  player: "Player",
};

const ROLE_COLORS: Record<UserRole, string> = {
  head_coach: "bg-rr-pink/10 text-rr-pink",
  assistant_coach: "bg-rr-blue/10 text-rr-blue",
  guest_coach: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  player: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

interface MemberWithEmail extends ProgramMember {
  email?: string;
}

export function MembersTab() {
  const supabase = createClient();
  const { activeProgram, isAdmin } = useProgram();
  const [members, setMembers] = useState<MemberWithEmail[]>([]);
  const [invites, setInvites] = useState<ProgramInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("assistant_coach");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!activeProgram) return;
    setLoading(true);

    const [memberRes, inviteRes] = await Promise.all([
      supabase
        .from("sp_program_members")
        .select("*")
        .eq("program_id", activeProgram.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("sp_program_invites")
        .select("*")
        .eq("program_id", activeProgram.id)
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
    ]);

    setMembers((memberRes.data || []) as MemberWithEmail[]);
    setInvites((inviteRes.data || []) as ProgramInvite[]);
    setLoading(false);
  }, [supabase, activeProgram]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreateInvite = async () => {
    if (!activeProgram) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("sp_program_invites")
      .insert({
        program_id: activeProgram.id,
        email: inviteEmail || null,
        role: inviteRole,
        invited_by: user.id,
      });

    if (error) {
      toast.error("Failed to create invite: " + error.message);
      return;
    }

    toast.success("Invite created!");
    setInviteEmail("");
    setShowInviteForm(false);
    fetchMembers();
  };

  const handleCopyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success("Invite link copied!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member from the program?")) return;

    const { error } = await supabase
      .from("sp_program_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast.error("Failed to remove member: " + error.message);
      return;
    }

    toast.success("Member removed");
    fetchMembers();
  };

  const handleChangeRole = async (memberId: string, newRole: UserRole) => {
    const { error } = await supabase
      .from("sp_program_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      toast.error("Failed to update role: " + error.message);
      return;
    }

    toast.success("Role updated");
    fetchMembers();
  };

  const handleDeleteInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from("sp_program_invites")
      .delete()
      .eq("id", inviteId);

    if (error) {
      toast.error("Failed to delete invite: " + error.message);
      return;
    }

    toast.success("Invite deleted");
    fetchMembers();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Members List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-rr-charcoal dark:text-white">
            Members ({members.length})
          </h3>
          {isAdmin && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rr-blue text-white rounded-lg hover:bg-rr-blue/90 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite
            </button>
          )}
        </div>

        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                  {member.user_id.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-rr-charcoal dark:text-white">
                    {member.email || member.user_id.slice(0, 8) + "..."}
                  </p>
                  <p className="text-xs text-gray-400">
                    Joined {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value as UserRole)}
                    className="text-xs font-medium px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-rr-charcoal dark:text-gray-200"
                  >
                    <option value="head_coach">Head Coach</option>
                    <option value="assistant_coach">Assistant Coach</option>
                    <option value="guest_coach">Guest Coach</option>
                    <option value="player">Player</option>
                  </select>
                ) : (
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      ROLE_COLORS[member.role]
                    )}
                  >
                    {ROLE_LABELS[member.role]}
                  </span>
                )}

                {isAdmin && member.role !== "head_coach" && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-rr-charcoal dark:text-white mb-3">
            Pending Invites ({invites.length})
          </h3>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-rr-charcoal dark:text-white">
                      {invite.email || "Open invite"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {ROLE_LABELS[invite.role]} · Expires{" "}
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyInviteLink(invite.token)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-rr-blue hover:bg-rr-blue/10 rounded-lg transition"
                  >
                    {copiedToken === invite.token ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedToken === invite.token ? "Copied" : "Copy Link"}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteInvite(invite.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-rr-charcoal dark:text-white mb-4">
              Invite to {activeProgram?.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                  Email (optional — leave blank for open invite)
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="coach@example.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-rr-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-rr-blue/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-rr-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-rr-blue/50"
                >
                  <option value="assistant_coach">Assistant Coach</option>
                  <option value="guest_coach">Guest Coach</option>
                  <option value="player">Player</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvite}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-rr-blue rounded-lg hover:bg-rr-blue/90 transition"
                >
                  Create Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
