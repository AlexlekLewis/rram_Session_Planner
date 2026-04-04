// ============================================================================
// RRA Session Planner — PDF Export Utility
// ============================================================================

import jsPDF, { jsPDFOptions } from "jspdf";
import autoTable from "jspdf-autotable";
import { Session, SessionBlock, Squad, Tier } from "./types";
import {
  CATEGORY_LABELS,
  CATEGORY_COLOURS,
  TIER_LABELS,
  TIER_COLOURS,
  formatTime,
  LANES,
} from "./constants";

// Brand colors
const BRAND_PINK = "#E11F8F";
const BRAND_BLUE = "#1226AA";

/**
 * Convert lane numbers to lane label (e.g., "M1-M3" or "L4-L5")
 */
function getLaneLabel(laneStart: number, laneEnd: number): string {
  if (laneStart === laneEnd) {
    const lane = LANES.find((l) => l.id === laneStart);
    return lane?.short || `Lane ${laneStart}`;
  }

  const startLane = LANES.find((l) => l.id === laneStart);
  const endLane = LANES.find((l) => l.id === laneEnd);
  const startLabel = startLane?.short || `${laneStart}`;
  const endLabel = endLane?.short || `${laneEnd}`;

  return `${startLabel}-${endLabel}`;
}

/**
 * Hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {
    r: result ? parseInt(result[1], 16) : 0,
    g: result ? parseInt(result[2], 16) : 0,
    b: result ? parseInt(result[3], 16) : 0,
  };
}

/**
 * Export session plan as PDF
 */
export async function exportSessionPdf(
  session: Session,
  blocks: SessionBlock[],
  squads: Squad[]
): Promise<void> {
  // Create PDF in landscape A4
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  } as jsPDFOptions);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;

  // ========================================================================
  // 1. Header with Gradient Bar
  // ========================================================================

  // Gradient bar (simplified: pink to blue)
  const gradientHeight = 25;
  const gradientSteps = 50;

  for (let i = 0; i < gradientSteps; i++) {
    const progress = i / gradientSteps;
    const pinkRgb = hexToRgb(BRAND_PINK);
    const blueRgb = hexToRgb(BRAND_BLUE);

    const r = Math.round(pinkRgb.r + (blueRgb.r - pinkRgb.r) * progress);
    const g = Math.round(pinkRgb.g + (blueRgb.g - pinkRgb.g) * progress);
    const b = Math.round(pinkRgb.b + (blueRgb.b - pinkRgb.b) * progress);

    pdf.setFillColor(r, g, b);
    const xPos = margin + (i / gradientSteps) * contentWidth;
    const width = (contentWidth / gradientSteps) + 1;
    pdf.rect(xPos, margin, width, gradientHeight, "F");
  }

  // Title
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  pdf.text("RRA Melbourne — Session Plan", margin + 6, margin + 16);

  let yPos = margin + gradientHeight + 8;

  // Session info line
  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(50, 50, 50);

  const squadNames = squads
    .filter((s) => session.squad_ids.includes(s.id))
    .map((s) => s.name)
    .join(", ");

  const infoLine = `${session.date} | ${formatTime(session.start_time)} – ${formatTime(session.end_time)} | ${squadNames} ${session.theme ? `| Theme: ${session.theme}` : ""} | Status: ${session.status}`;

  pdf.text(infoLine, margin, yPos);
  yPos += 8;

  // ========================================================================
  // 2. Session Block Table
  // ========================================================================

  // Sort blocks by time_start, then lane_start
  const sortedBlocks = [...blocks].sort((a, b) => {
    const timeCompare = a.time_start.localeCompare(b.time_start);
    return timeCompare !== 0 ? timeCompare : a.lane_start - b.lane_start;
  });

  // Prepare table data
  const tableData = sortedBlocks.map((block) => {
    const categoryLabel = CATEGORY_LABELS[block.category];
    const tierLabel = TIER_LABELS[block.tier];
    const laneLabel = getLaneLabel(block.lane_start, block.lane_end);
    const coachName = block.coach_assigned || "";
    const coachingPointsText = block.coaching_points.join("; ") || "";
    const equipmentText = block.equipment.join(", ") || "";

    return [
      `${formatTime(block.time_start)}–${formatTime(block.time_end)}`,
      laneLabel,
      block.name,
      categoryLabel,
      tierLabel,
      coachName,
      coachingPointsText,
      equipmentText,
    ];
  });

  // Create table
  autoTable(pdf, {
    startY: yPos,
    head: [
      ["Time", "Lane(s)", "Activity", "Category", "Tier", "Coach", "Coaching Points", "Equipment"],
    ],
    body: tableData,
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 18 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 15 },
      5: { cellWidth: 20 },
      6: { cellWidth: 45 },
      7: { cellWidth: 30 },
    },
    headStyles: {
      fillColor: [50, 50, 50],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "left" as const,
      valign: "middle" as const,
    },
    bodyStyles: {
      fontSize: 8,
      valign: "top" as const,
      halign: "left" as const,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      // Color category cells
      if (data.column.index === 3) {
        const categoryKey = sortedBlocks[data.row.index]?.category;
        if (categoryKey) {
          const bgColor = CATEGORY_COLOURS[categoryKey];
          const rgb = hexToRgb(bgColor);
          data.cell.styles.fillColor = [rgb.r, rgb.g, rgb.b];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      }

      // Color tier cells with badge-like appearance
      if (data.column.index === 4) {
        const tierKey = sortedBlocks[data.row.index]?.tier;
        if (tierKey) {
          const bgColor = TIER_COLOURS[tierKey as Tier];
          const rgb = hexToRgb(bgColor);
          data.cell.styles.fillColor = [rgb.r, rgb.g, rgb.b];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // ========================================================================
  // 3. Footer
  // ========================================================================

  const footerY = pageHeight - 8;
  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);

  // Page number and generated by text
  const pageNum = pdf.internal.pages.length - 1;
  const pageCount = pdf.internal.pages.length - 1;
  pdf.text(`Page ${pageNum} of ${pageCount}`, margin, footerY);
  pdf.text("Generated by RRA Session Planner", pageWidth - margin - 50, footerY);

  // ========================================================================
  // 4. Download
  // ========================================================================

  const fileName = `RRA_Session_Plan_${session.date}.pdf`;
  pdf.save(fileName);
}
