"use client";

import { Phase } from "@/lib/types";

interface PhaseBannerProps {
  phase: Phase | null;
}

export function PhaseBanner({ phase }: PhaseBannerProps) {
  if (!phase) {
    return null;
  }

  // Parse dates
  // Append T00:00:00 to prevent timezone shift (BUG-010 pattern)
  const startDate = new Date(phase.start_date + "T00:00:00");
  const endDate = new Date(phase.end_date + "T00:00:00");

  const startStr = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mb-6 bg-rr-gradient rounded-lg p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold font-montserrat mb-2">
            {phase.name}
          </h2>
          <p className="text-sm opacity-90 mb-4">
            {startStr} — {endStr}
          </p>

          {phase.goals && phase.goals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {phase.goals.map((goal, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium"
                >
                  {goal}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
