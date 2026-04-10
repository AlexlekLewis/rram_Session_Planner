"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Session, SessionBlock, Squad } from "@/lib/types";
import { formatTime } from "@/lib/constants";
import { SquadBadge } from "@/components/shared/SquadBadge";
import { ReadOnlyGrid } from "@/components/session-grid/ReadOnlyGrid";
import { ExportPdfButton } from "@/components/shared/ExportPdfButton";

interface SessionWithDetails extends Session {
  squads?: Squad[];
}

export default function PlayerSessionPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [blocks, setBlocks] = useState<SessionBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);

        // Fetch session
        const { data: sessionData, error: sessionError } = await supabase
          .from("sp_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (sessionError) throw sessionError;

        // Fetch blocks
        const { data: blocksData, error: blocksError } = await supabase
          .from("sp_session_blocks")
          .select("*")
          .eq("session_id", sessionId)
          .order("sort_order");

        if (blocksError) throw blocksError;

        // Fetch squads
        const { data: squadsData, error: squadsError } = await supabase
          .from("sp_squads")
          .select("*");

        if (squadsError) throw squadsError;

        // Enrich session with squad data
        const sessionSquads = (sessionData?.squad_ids || [])
          .map((squadId: string) =>
            (squadsData || []).find((s: { id: string }) => s.id === squadId)
          )
          .filter(Boolean);

        setSession({
          ...sessionData,
          squads: sessionSquads,
        });

        setBlocks(blocksData || []);
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId, supabase]);

  const handleBack = () => {
    router.push("/dashboard/player");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleBack}
            className="mb-6 text-rr-blue hover:underline font-medium"
          >
            ← Back to My Sessions
          </button>
          <p className="text-gray-500 dark:text-gray-400">Session not found</p>
        </div>
      </div>
    );
  }

  // Format date
  const dateObj = new Date(session.date);
  const dayName = dateObj.toLocaleDateString("en-AU", { weekday: "long" });
  const dateStr = dateObj.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusColor = {
    draft: "bg-amber-100 text-amber-800",
    published: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
  }[session.status];

  const statusLabel = {
    draft: "Draft",
    published: "Published",
    completed: "Completed",
  }[session.status];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="mb-6 text-rr-blue hover:underline font-medium flex items-center gap-2"
        >
          ← Back to My Sessions
        </button>

        {/* Header section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex-1">
              {/* Date and time */}
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-rr-charcoal font-montserrat">
                  {dayName}
                </h1>
                <span className="text-lg text-gray-500 dark:text-gray-400">{dateStr}</span>
              </div>

              {/* Time range */}
              <div className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                {formatTime(session.start_time)} -{" "}
                {formatTime(session.end_time)}
              </div>

              {/* Theme */}
              {session.theme && (
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-rr-charcoal">
                    {session.theme}
                  </h2>
                </div>
              )}

              {/* Squads */}
              {session.squads && session.squads.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {session.squads.map((squad) => (
                    <SquadBadge
                      key={squad.id}
                      name={squad.name}
                      colour={squad.colour}
                      size="md"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Status badge + download button */}
            <div className="flex-shrink-0 flex flex-col items-end gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColor}`}
              >
                {statusLabel}
              </span>
              <ExportPdfButton
                variant="player"
                session={session}
                blocks={blocks}
                squads={session.squads || []}
              />
            </div>
          </div>

          {/* Specialist coaches */}
          {session.specialist_coaches &&
            session.specialist_coaches.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Coaches:</span>{" "}
                  {session.specialist_coaches.map((coach) => coach.name).join(", ")}
                </p>
              </div>
            )}

          {/* Notes */}
          {session.notes && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Notes:</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{session.notes}</p>
            </div>
          )}
        </div>

        {/* Session grid */}
        <div>
          <h3 className="text-lg font-bold text-rr-charcoal font-montserrat mb-4">
            Session Plan
          </h3>
          <ReadOnlyGrid session={session} blocks={blocks} />
        </div>

        {/* No blocks message */}
        {blocks.length === 0 && (
          <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-500 dark:text-gray-400">
            <p>No activities planned for this session yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
