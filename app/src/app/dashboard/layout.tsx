"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useUserRole } from "@/hooks/useUserRole";
import { UserRole, Program, Phase, Session, Activity, Squad } from "@/lib/types";
import { AssistantPanel } from "@/components/ai-assistant/AssistantPanel";
import { AssistantSessionProvider, useAssistantSessionContext } from "@/lib/assistant-session-context";
import { useAssistant } from "@/hooks/useAssistant";
import { Sparkles } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/month", label: "Month", icon: CalendarIcon },
  { href: "/dashboard/sessions", label: "Sessions", icon: ListIcon },
  { href: "/dashboard/library", label: "Library", icon: BookIcon, roles: ["head_coach", "assistant_coach", "guest_coach"] },
  { href: "/dashboard/player", label: "Player View", icon: PlayerIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon, roles: ["head_coach"] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { role, isAdmin } = useUserRole();
  const [userEmail, setUserEmail] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Global data for AI Coach context
  const [program, setProgram] = useState<Program | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [globalSquads, setGlobalSquads] = useState<Squad[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
    });
  }, [supabase]);

  // Fetch global program data for AI Coach
  const fetchGlobalData = useCallback(async () => {
    const [progRes, phaseRes, sessRes, actRes, squadRes] = await Promise.all([
      supabase.from("sp_programs").select("*").single(),
      supabase.from("sp_phases").select("*").order("sort_order"),
      supabase.from("sp_sessions").select("*").order("date"),
      supabase.from("sp_activities").select("*").eq("is_global", true).order("name"),
      supabase.from("sp_squads").select("*").order("name"),
    ]);
    if (progRes.data) setProgram(progRes.data as Program);
    setPhases((phaseRes.data || []) as Phase[]);
    setAllSessions((sessRes.data || []) as Session[]);
    setAllActivities((actRes.data || []) as Activity[]);
    setGlobalSquads((squadRes.data || []) as Squad[]);
  }, [supabase]);

  useEffect(() => { fetchGlobalData(); }, [fetchGlobalData]);

  const canUseAssistant = role === "head_coach" || role === "assistant_coach";

  // Filter nav items by role
  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(role);
    });
  }, [role]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <AssistantSessionProvider>
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard/month" className="flex items-center gap-2">
              <Image src="/logo.png" alt="RRA" width={36} height={36} />
              <span className="font-bold text-rr-charcoal text-sm hidden sm:inline">
                Session Planner
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              {visibleNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard/month" && pathname.startsWith(item.href)) ||
                  (item.href === "/dashboard/month" && pathname.startsWith("/dashboard/session/"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-rr-blue/10 text-rr-blue"
                        : "text-gray-500 hover:text-rr-charcoal hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: AI Coach + Theme + User */}
          <div className="flex items-center gap-3">
            {canUseAssistant && (
              <button
                onClick={() => setAssistantOpen(!assistantOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition",
                  assistantOpen
                    ? "bg-gradient-to-r from-rr-blue to-rr-pink text-white"
                    : "text-rr-pink hover:bg-rr-pink/10"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Coach</span>
              </button>
            )}
            <ThemeToggle />
            {isAdmin && (
              <span className="text-[10px] font-semibold bg-rr-pink/10 text-rr-pink px-1.5 py-0.5 rounded-full">
                Admin
              </span>
            )}
            <span className="text-xs text-gray-400 hidden sm:inline">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-red-500 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Global AI Coach — reads active session from context */}
      {canUseAssistant && (
        <GlobalAssistant
          isOpen={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          allActivities={allActivities}
          globalSquads={globalSquads}
          program={program}
          phases={phases}
          allSessions={allSessions}
          fetchGlobalData={fetchGlobalData}
          router={router}
        />
      )}
    </div>
    </AssistantSessionProvider>
  );
}

// ============================================================================
// Inline SVG Icons (keeps bundle small, no extra deps)
// ============================================================================

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function PlayerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ============================================================================
// Global AI Coach — reads active session from context
// ============================================================================
function GlobalAssistant({
  isOpen,
  onClose,
  allActivities,
  globalSquads,
  program,
  phases,
  allSessions,
  fetchGlobalData,
  router,
}: {
  isOpen: boolean;
  onClose: () => void;
  allActivities: Activity[];
  globalSquads: Squad[];
  program: Program | null;
  phases: Phase[];
  allSessions: Session[];
  fetchGlobalData: () => Promise<void>;
  router: ReturnType<typeof useRouter>;
}) {
  // Read active session context from the session page (if viewing one)
  const { activeSession } = useAssistantSessionContext();

  const assistant = useAssistant({
    // Session-level context (available when viewing a session)
    session: activeSession?.session || null,
    blocks: activeSession?.blocks,
    sessionId: activeSession?.sessionId,
    onAddBlock: activeSession?.onAddBlock,
    onUpdateBlock: activeSession?.onUpdateBlock,
    onDeleteBlock: activeSession?.onDeleteBlock,
    onMoveBlock: activeSession?.onMoveBlock,
    hasCollision: activeSession?.hasCollision,
    copyHour: activeSession?.copyHour,
    onUpdateSession: activeSession?.onUpdateSession,
    // Program-level context (always available)
    activities: allActivities,
    squads: globalSquads,
    program,
    phases,
    allSessions,
    onSessionUpdated: useCallback(() => {
      fetchGlobalData();
      router.refresh();
    }, [fetchGlobalData, router]),
  });

  return (
    <AssistantPanel
      isOpen={isOpen}
      onClose={onClose}
      messages={assistant.messages}
      isLoading={assistant.isLoading}
      error={assistant.error}
      onSendMessage={assistant.sendMessage}
      onApplyActions={assistant.applyActions}
      onClearChat={assistant.clearChat}
    />
  );
}
