// ============================================================================
// RRA Session Planner — PDF Export Utility
// ============================================================================
// Two export variants:
//   • exportCoachPdf  — landscape, full-detail session sheet for coaches
//   • exportPlayerPdf — portrait, stripped-down sheet for players
//
// Both share the same brand header (navy→blue→pink gradient, transparent logo,
// charcoal footer) via the helpers at the top of this file.
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

// ============================================================================
// Brand
// ============================================================================

const BRAND = {
  pink: "#E11F8F",
  blue: "#1226AA",
  navy: "#001D48",
  lightPink: "#E96BB0",
  mediumBlue: "#0075C9",
  charcoal: "#323E48",
} as const;

// ============================================================================
// Helpers
// ============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {
    r: result ? parseInt(result[1], 16) : 0,
    g: result ? parseInt(result[2], 16) : 0,
    b: result ? parseInt(result[3], 16) : 0,
  };
}

/** Convert lane numbers to lane label (e.g., "M1-M3" or "L4-L5"). */
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

/** Interpolate between two hex colours by t ∈ [0,1]. */
function mixHex(a: string, b: string, t: number): { r: number; g: number; b: number } {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  return {
    r: Math.round(ra.r + (rb.r - ra.r) * t),
    g: Math.round(ra.g + (rb.g - ra.g) * t),
    b: Math.round(ra.b + (rb.b - ra.b) * t),
  };
}

// ----------------------------------------------------------------------------
// Logo cache — fetch once per session, reuse for every subsequent export.
// ----------------------------------------------------------------------------

let cachedLogoDataUrl: string | null = null;
let cachedLogoDims: { w: number; h: number } | null = null;

async function loadLogoAsDataUrl(): Promise<{
  dataUrl: string;
  width: number;
  height: number;
} | null> {
  if (cachedLogoDataUrl && cachedLogoDims) {
    return {
      dataUrl: cachedLogoDataUrl,
      width: cachedLogoDims.w,
      height: cachedLogoDims.h,
    };
  }
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) throw new Error(`Logo fetch failed: ${res.status}`);
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    // Read intrinsic dimensions so we can preserve aspect ratio.
    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => reject(new Error("Logo decode failed"));
      img.src = dataUrl;
    });
    cachedLogoDataUrl = dataUrl;
    cachedLogoDims = dims;
    return { dataUrl, width: dims.w, height: dims.h };
  } catch (err) {
    console.warn("[exportPdf] Could not load logo, continuing without it:", err);
    return null;
  }
}

// ----------------------------------------------------------------------------
// Brand header — gradient bar + logo + title + session info
// ----------------------------------------------------------------------------

interface HeaderOptions {
  session: Session;
  squads: Squad[];
  /** Pre-loaded logo (null if fetch failed). */
  logo: { dataUrl: string; width: number; height: number } | null;
}

/**
 * Draws the branded page header and returns the Y position (in mm) where
 * content should continue below it.
 */
function drawBrandHeader(pdf: jsPDF, opts: HeaderOptions): number {
  const { session, squads, logo } = opts;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;
  const headerHeight = 26;

  // --- Three-stop gradient (navy → blue → pink) drawn as 120 vertical slivers
  const steps = 120;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    // Two segments: [0, 0.4] navy→blue, [0.4, 1] blue→pink.
    let rgb: { r: number; g: number; b: number };
    if (t <= 0.4) {
      rgb = mixHex(BRAND.navy, BRAND.blue, t / 0.4);
    } else {
      rgb = mixHex(BRAND.blue, BRAND.pink, (t - 0.4) / 0.6);
    }
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
    const sliverWidth = contentWidth / steps + 0.3; // overlap to avoid seams
    const x = margin + t * contentWidth;
    pdf.rect(x, margin, sliverWidth, headerHeight, "F");
  }

  // --- Logo (left side, preserving aspect ratio, transparent background)
  let textStartX = margin + 6;
  if (logo) {
    const padding = 4;
    const maxH = headerHeight - padding * 2;
    const aspect = logo.width / logo.height;
    const logoH = maxH;
    const logoW = logoH * aspect;
    const logoX = margin + padding;
    const logoY = margin + padding;
    // "PNG" with alpha is respected by jsPDF — transparency is preserved.
    pdf.addImage(logo.dataUrl, "PNG", logoX, logoY, logoW, logoH, undefined, "FAST");
    textStartX = logoX + logoW + 5;
  }

  // --- Title (white, bold)
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text("RRA Melbourne — Session Plan", textStartX, margin + 11);

  // --- Sub-line (white, regular) — date · time · squads
  const dateObj = new Date(session.date);
  const dateStr = dateObj.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const squadNames =
    squads
      .filter((s) => session.squad_ids.includes(s.id))
      .map((s) => s.name)
      .join(", ") || "";
  const subParts = [
    dateStr,
    `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`,
  ];
  if (squadNames) subParts.push(squadNames);

  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(subParts.join("  •  "), textStartX, margin + 19);

  // --- Second meta row below the bar (theme, status) in charcoal
  let y = margin + headerHeight + 7;
  const metaParts: string[] = [];
  if (session.theme) metaParts.push(`Theme: ${session.theme}`);
  // Status only shown on coach variant — caller decides whether to include.
  if (metaParts.length > 0) {
    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(10);
    const charcoal = hexToRgb(BRAND.charcoal);
    pdf.setTextColor(charcoal.r, charcoal.g, charcoal.b);
    pdf.text(metaParts.join("  •  "), margin, y);
    y += 6;
  }

  return y;
}

// ----------------------------------------------------------------------------
// Brand footer — charcoal rule + page number + tagline
// ----------------------------------------------------------------------------

function drawBrandFooter(
  pdf: jsPDF,
  opts: { pageNumber: number; pageCount: number; tagline: string }
): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const footerY = pageHeight - 10;

  // Thin charcoal rule
  const charcoal = hexToRgb(BRAND.charcoal);
  pdf.setDrawColor(charcoal.r, charcoal.g, charcoal.b);
  pdf.setLineWidth(0.2);
  pdf.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(charcoal.r, charcoal.g, charcoal.b);
  pdf.text(`Page ${opts.pageNumber} of ${opts.pageCount}`, margin, footerY);
  pdf.text(opts.tagline, pageWidth - margin, footerY, { align: "right" });
}

// ============================================================================
// Sort helper — shared by both variants
// ============================================================================

function sortBlocks(blocks: SessionBlock[]): SessionBlock[] {
  return [...blocks].sort((a, b) => {
    const timeCompare = a.time_start.localeCompare(b.time_start);
    return timeCompare !== 0 ? timeCompare : a.lane_start - b.lane_start;
  });
}

// ============================================================================
// COACH VARIANT — landscape, full detail
// ============================================================================

export async function exportCoachPdf(
  session: Session,
  blocks: SessionBlock[],
  squads: Squad[]
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  } as jsPDFOptions);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 12;

  const logo = await loadLogoAsDataUrl();
  const startY = drawBrandHeader(pdf, { session, squads, logo });

  const sortedBlocks = sortBlocks(blocks);

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

  const charcoal = hexToRgb(BRAND.charcoal);

  autoTable(pdf, {
    startY,
    head: [
      ["Time", "Lane(s)", "Activity", "Category", "Tier", "Coach", "Coaching Points", "Equipment"],
    ],
    body:
      tableData.length > 0
        ? tableData
        : [["", "", "No activities planned for this session yet", "", "", "", "", ""]],
    margin: { left: margin, right: margin, bottom: 18 },
    showHead: "everyPage",
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 18 },
      2: { cellWidth: 38 },
      3: { cellWidth: 28 },
      4: { cellWidth: 16 },
      5: { cellWidth: 22 },
      6: { cellWidth: "auto" },
      7: { cellWidth: 34 },
    },
    headStyles: {
      fillColor: [charcoal.r, charcoal.g, charcoal.b],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "left" as const,
      valign: "middle" as const,
      cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 },
    },
    bodyStyles: {
      fontSize: 8,
      valign: "top" as const,
      halign: "left" as const,
      cellPadding: { top: 1.8, right: 2.5, bottom: 1.8, left: 2.5 },
      textColor: [charcoal.r, charcoal.g, charcoal.b],
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 250],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      if (data.section !== "body" || tableData.length === 0) return;
      // Colour category cells
      if (data.column.index === 3) {
        const categoryKey = sortedBlocks[data.row.index]?.category;
        if (categoryKey) {
          const rgb = hexToRgb(CATEGORY_COLOURS[categoryKey]);
          data.cell.styles.fillColor = [rgb.r, rgb.g, rgb.b];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.halign = "center";
        }
      }
      // Colour tier cells
      if (data.column.index === 4) {
        const tierKey = sortedBlocks[data.row.index]?.tier;
        if (tierKey) {
          const rgb = hexToRgb(TIER_COLOURS[tierKey as Tier]);
          data.cell.styles.fillColor = [rgb.r, rgb.g, rgb.b];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.halign = "center";
        }
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didDrawPage: (data: any) => {
      // Re-draw the header on page 2+ as a compact strip (no gradient, no logo),
      // so the first page is the only one with the full brand hero.
      if (data.pageNumber > 1) {
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(11);
        const charcoalRgb = hexToRgb(BRAND.charcoal);
        pdf.setTextColor(charcoalRgb.r, charcoalRgb.g, charcoalRgb.b);
        pdf.text(
          `RRA Melbourne — Session Plan  •  ${session.date}`,
          margin,
          margin + 4
        );
      }
      const pageCount = pdf.internal.pages.length - 1;
      drawBrandFooter(pdf, {
        pageNumber: data.pageNumber,
        pageCount,
        tagline: "Generated by RRA Session Planner",
      });
    },
  });

  // autoTable's didDrawPage runs at draw time, which means the final pageCount
  // is correct only for pages drawn after the last one. Rewrite all footers
  // with the true total page count.
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    // Clear the previous footer area by redrawing with the final total.
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, pageHeight - 14, pageWidth, 14, "F");
    drawBrandFooter(pdf, {
      pageNumber: i,
      pageCount: totalPages,
      tagline: "Generated by RRA Session Planner",
    });
  }

  pdf.save(`RRA_Session_Plan_${session.date}.pdf`);
}

// ============================================================================
// PLAYER VARIANT — portrait, stripped-down
// ============================================================================

export async function exportPlayerPdf(
  session: Session,
  blocks: SessionBlock[],
  squads: Squad[]
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  } as jsPDFOptions);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 12;

  const logo = await loadLogoAsDataUrl();
  const startY = drawBrandHeader(pdf, { session, squads, logo });

  const sortedBlocks = sortBlocks(blocks);

  const tableData = sortedBlocks.map((block) => {
    const categoryLabel = CATEGORY_LABELS[block.category];
    const tierLabel = TIER_LABELS[block.tier];
    const laneLabel = getLaneLabel(block.lane_start, block.lane_end);
    return [
      `${formatTime(block.time_start)}–${formatTime(block.time_end)}`,
      block.name,
      laneLabel,
      categoryLabel,
      tierLabel,
    ];
  });

  const charcoal = hexToRgb(BRAND.charcoal);

  autoTable(pdf, {
    startY,
    head: [["Time", "Activity", "Lane", "Category", "Tier"]],
    body:
      tableData.length > 0
        ? tableData
        : [["", "No activities planned yet", "", "", ""]],
    margin: { left: margin, right: margin, bottom: 18 },
    showHead: "everyPage",
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 22 },
      3: { cellWidth: 38 },
      4: { cellWidth: 18 },
    },
    headStyles: {
      fillColor: [charcoal.r, charcoal.g, charcoal.b],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      halign: "left" as const,
      valign: "middle" as const,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
    },
    bodyStyles: {
      fontSize: 10,
      valign: "middle" as const,
      halign: "left" as const,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      textColor: [charcoal.r, charcoal.g, charcoal.b],
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 250],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      if (data.section !== "body" || tableData.length === 0) return;
      // Colour category cells
      if (data.column.index === 3) {
        const categoryKey = sortedBlocks[data.row.index]?.category;
        if (categoryKey) {
          const rgb = hexToRgb(CATEGORY_COLOURS[categoryKey]);
          data.cell.styles.fillColor = [rgb.r, rgb.g, rgb.b];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.halign = "center";
        }
      }
      // Colour tier cells
      if (data.column.index === 4) {
        const tierKey = sortedBlocks[data.row.index]?.tier;
        if (tierKey) {
          const rgb = hexToRgb(TIER_COLOURS[tierKey as Tier]);
          data.cell.styles.fillColor = [rgb.r, rgb.g, rgb.b];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.halign = "center";
        }
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didDrawPage: (data: any) => {
      if (data.pageNumber > 1) {
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(11);
        const charcoalRgb = hexToRgb(BRAND.charcoal);
        pdf.setTextColor(charcoalRgb.r, charcoalRgb.g, charcoalRgb.b);
        pdf.text(
          `RRA Melbourne — Session Plan  •  ${session.date}`,
          margin,
          margin + 4
        );
      }
      const pageCount = pdf.internal.pages.length - 1;
      drawBrandFooter(pdf, {
        pageNumber: data.pageNumber,
        pageCount,
        tagline: "For player reference only",
      });
    },
  });

  // Rewrite footers with correct total page count.
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, pageHeight - 14, pageWidth, 14, "F");
    drawBrandFooter(pdf, {
      pageNumber: i,
      pageCount: totalPages,
      tagline: "For player reference only",
    });
  }

  pdf.save(`RRA_Player_Plan_${session.date}.pdf`);
}

// ============================================================================
// Back-compat alias — remove after all callers migrate to exportCoachPdf.
// ============================================================================

export const exportSessionPdf = exportCoachPdf;
