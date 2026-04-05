"use client";
import { Session, SessionBlock, Squad } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

interface ExportPdfButtonProps {
  session: Session;
  blocks: SessionBlock[];
  squads: Squad[];
}

export function ExportPdfButton({ session, blocks, squads }: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    toast.loading("Exporting PDF...", { id: "pdf-export" });
    try {
      const { exportSessionPdf } = await import("@/lib/exportPdf");
      await exportSessionPdf(session, blocks, squads);
      toast.success("PDF downloaded", { id: "pdf-export" });
    } catch (err) {
      console.error("Error exporting PDF:", err);
      toast.error("PDF export failed", { id: "pdf-export" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
    >
      {isExporting ? "Exporting..." : "Export PDF"}
    </button>
  );
}
