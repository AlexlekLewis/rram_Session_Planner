"use client";
import { Session, SessionBlock, Squad } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

type Variant = "coach" | "player";

interface ExportPdfButtonProps {
  session: Session;
  blocks: SessionBlock[];
  squads: Squad[];
  variant?: Variant;
}

export function ExportPdfButton({
  session,
  blocks,
  squads,
  variant = "coach",
}: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const toastId = `pdf-export-${variant}`;
  const idleLabel = variant === "player" ? "Download Plan (PDF)" : "Export PDF";
  const busyLabel = variant === "player" ? "Downloading..." : "Exporting...";

  const handleExport = async () => {
    setIsExporting(true);
    toast.loading(
      variant === "player" ? "Preparing your plan..." : "Exporting PDF...",
      { id: toastId }
    );
    try {
      const mod = await import("@/lib/exportPdf");
      if (variant === "player") {
        await mod.exportPlayerPdf(session, blocks, squads);
      } else {
        await mod.exportCoachPdf(session, blocks, squads);
      }
      toast.success("PDF downloaded", { id: toastId });
    } catch (err) {
      console.error("Error exporting PDF:", err);
      toast.error("PDF export failed", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const classes =
    variant === "player"
      ? "text-sm px-4 py-2 bg-rr-pink text-white font-semibold rounded-lg hover:bg-rr-pink/90 transition disabled:opacity-50 shadow-sm"
      : "text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50";

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={classes}
    >
      {isExporting ? busyLabel : idleLabel}
    </button>
  );
}
