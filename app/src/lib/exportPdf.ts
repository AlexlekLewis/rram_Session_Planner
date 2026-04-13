// ============================================================================
// RRA Session Planner — PDF Export Utility (Grid Layout)
// ============================================================================

import jsPDF from "jspdf";
import { Session, SessionBlock, Squad, Tier } from "./types";
import {
  CATEGORY_LABELS,
  TIER_LABELS,
  TIER_COLOURS,
  formatTime,
  LANES,
  TOTAL_LANES,
} from "./constants";

// Brand colors
const BRAND_PINK = "#E11F8F";
const BRAND_BLUE = "#1226AA";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {
    r: result ? parseInt(result[1], 16) : 0,
    g: result ? parseInt(result[2], 16) : 0,
    b: result ? parseInt(result[3], 16) : 0,
  };
}

/** HH:MM → total minutes */
function toMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Total minutes → HH:MM */
function fromMins(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

/** Luminance-based contrast check */
function isDark(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 < 150;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function exportSessionPdf(
  session: Session,
  blocks: SessionBlock[],
  squads: Squad[]
): Promise<void> {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();   // 297
  const pageH = pdf.internal.pageSize.getHeight();  // 210
  const margin = 10;
  const contentW = pageW - 2 * margin;

  // ========================================================================
  // 1. Header with Gradient Bar
  // ========================================================================

  const gradH = 18;
  const gradSteps = 50;
  const pk = hexToRgb(BRAND_PINK);
  const bl = hexToRgb(BRAND_BLUE);

  for (let i = 0; i < gradSteps; i++) {
    const p = i / gradSteps;
    pdf.setFillColor(
      Math.round(pk.r + (bl.r - pk.r) * p),
      Math.round(pk.g + (bl.g - pk.g) * p),
      Math.round(pk.b + (bl.b - pk.b) * p)
    );
    pdf.rect(
      margin + (i / gradSteps) * contentW,
      margin,
      contentW / gradSteps + 1,
      gradH,
      "F"
    );
  }

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text("RRA Melbourne — Session Plan", margin + 5, margin + 12);

  let yPos = margin + gradH + 5;

  // Session info
  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(50, 50, 50);
  const squadNames = squads
    .filter((s) => session.squad_ids.includes(s.id))
    .map((s) => s.name)
    .join(", ");
  const infoLine = [
    session.date,
    `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`,
    squadNames,
    session.theme ? `Theme: ${session.theme}` : "",
    `Status: ${session.status}`,
  ]
    .filter(Boolean)
    .join(" | ");
  pdf.text(infoLine, margin, yPos);
  yPos += 6;

  // ========================================================================
  // 2. Lane × Time Grid
  // ========================================================================

  const timeAxisW = 14;   // left column for time labels
  const laneHdrH = 7;     // lane header row height
  const gridLeft = margin + timeAxisW;
  const gridW = contentW - timeAxisW;
  const laneW = gridW / TOTAL_LANES;

  // Time range — cover session + all blocks, snapped to 15-min boundaries
  let tMin = toMins(session.start_time);
  let tMax = toMins(session.end_time);
  for (const b of blocks) {
    tMin = Math.min(tMin, toMins(b.time_start));
    tMax = Math.max(tMax, toMins(b.time_end));
  }
  tMin = Math.floor(tMin / 15) * 15;
  tMax = Math.ceil(tMax / 15) * 15;
  const totalMins = tMax - tMin || 15; // guard against zero

  const gridTop = yPos;
  const gridBottom = pageH - 8;
  const contentTop = gridTop + laneHdrH;
  const contentH = gridBottom - contentTop;

  /** Minutes value → Y coordinate */
  const mToY = (m: number) =>
    contentTop + ((m - tMin) / totalMins) * contentH;

  // ---- Lane header row ----
  pdf.setFillColor(50, 50, 50);
  pdf.rect(margin, gridTop, contentW, laneHdrH, "F");
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(255, 255, 255);
  LANES.forEach((lane, i) => {
    pdf.text(
      lane.short,
      gridLeft + i * laneW + laneW / 2,
      gridTop + 4.8,
      { align: "center" }
    );
  });

  // ---- Grid background with subtle lane-type tinting ----
  LANES.forEach((lane, i) => {
    const x = gridLeft + i * laneW;
    if (lane.type === "bowling_machine") {
      pdf.setFillColor(241, 245, 255);  // light blue tint
    } else if (lane.type === "other") {
      pdf.setFillColor(247, 245, 240);  // light warm tint
    } else {
      pdf.setFillColor(252, 252, 252);  // near-white
    }
    pdf.rect(x, contentTop, laneW, contentH, "F");
  });

  // Time axis background
  pdf.setFillColor(248, 248, 248);
  pdf.rect(margin, contentTop, timeAxisW, contentH, "F");

  // ---- 15-minute gridlines + time labels ----
  for (let m = tMin; m <= tMax; m += 15) {
    const y = mToY(m);
    const isHour = m % 60 === 0;

    // Horizontal gridline
    pdf.setDrawColor(isHour ? 160 : 215, isHour ? 160 : 215, isHour ? 160 : 215);
    pdf.setLineWidth(isHour ? 0.3 : 0.15);
    pdf.line(margin, y, margin + contentW, y);

    // Time label
    pdf.setFont("Helvetica", isHour ? "bold" : "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(70, 70, 70);
    pdf.text(
      formatTime(fromMins(m)),
      margin + timeAxisW - 1.5,
      y + 2.8,
      { align: "right" }
    );
  }

  // ---- Lane separator lines ----
  pdf.setDrawColor(215, 215, 215);
  pdf.setLineWidth(0.15);
  for (let i = 1; i < TOTAL_LANES; i++) {
    pdf.line(gridLeft + i * laneW, contentTop, gridLeft + i * laneW, gridBottom);
  }

  // ---- Draw blocks ----
  const sorted = [...blocks].sort((a, b) => {
    const tc = a.time_start.localeCompare(b.time_start);
    return tc !== 0 ? tc : a.lane_start - b.lane_start;
  });

  for (const block of sorted) {
    const bStart = Math.max(toMins(block.time_start), tMin);
    const bEnd = Math.min(toMins(block.time_end), tMax);
    if (bStart >= bEnd) continue;

    const y1 = mToY(bStart);
    const y2 = mToY(bEnd);
    const x1 = gridLeft + (block.lane_start - 1) * laneW;
    const bW = (block.lane_end - block.lane_start + 1) * laneW;
    const bH = y2 - y1;

    // Inset padding
    const pad = 0.4;
    const rx = x1 + pad;
    const ry = y1 + pad;
    const rw = bW - 2 * pad;
    const rh = bH - 2 * pad;
    if (rw <= 0 || rh <= 0) continue;

    const bg = hexToRgb(block.colour);
    const cornerR = Math.min(1.2, rh / 3, rw / 3);

    // Fill
    pdf.setFillColor(bg.r, bg.g, bg.b);
    pdf.roundedRect(rx, ry, rw, rh, cornerR, cornerR, "F");

    // Border (darker shade)
    pdf.setDrawColor(
      Math.max(0, bg.r - 50),
      Math.max(0, bg.g - 50),
      Math.max(0, bg.b - 50)
    );
    pdf.setLineWidth(0.25);
    pdf.roundedRect(rx, ry, rw, rh, cornerR, cornerR, "S");

    // Text color
    const dark = isDark(block.colour);
    const tc = dark ? [255, 255, 255] : [25, 25, 25];
    pdf.setTextColor(tc[0], tc[1], tc[2]);

    const tx = rx + 1.2;
    let ty = ry + 2.8;
    const maxTW = rw - 2.5;
    if (maxTW <= 0) continue;

    const durMins = bEnd - bStart;

    // ---- Activity name (always) ----
    const nameSz = rh < 5 ? 4.5 : rh < 8 ? 5.5 : 6.5;
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(nameSz);
    const nameLines = pdf.splitTextToSize(block.name, maxTW);
    const maxNameLines = rh > 9 ? Math.min(nameLines.length, 2) : 1;
    for (let i = 0; i < maxNameLines; i++) {
      if (ty > ry + rh - 1) break;
      pdf.text(nameLines[i], tx, ty);
      ty += nameSz * 0.42 + 0.6;
    }

    // ---- Duration / time range ----
    if (rh > 7 && ty < ry + rh - 1) {
      pdf.setFont("Helvetica", "normal");
      pdf.setFontSize(5);
      pdf.text(
        `${formatTime(fromMins(bStart))}–${formatTime(fromMins(bEnd))} (${durMins}m)`,
        tx,
        ty
      );
      ty += 2.5;
    }

    // ---- Tier badge + category label ----
    if (rh > 11 && ty < ry + rh - 1) {
      // Tier pill
      const tierCol = hexToRgb(TIER_COLOURS[block.tier as Tier]);
      const pillW = 3.5;
      const pillH = 2.3;
      const pillX = tx;
      const pillY = ty - 1.6;
      pdf.setFillColor(tierCol.r, tierCol.g, tierCol.b);
      pdf.roundedRect(pillX, pillY, pillW, pillH, 0.5, 0.5, "F");
      pdf.setFontSize(4.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text(block.tier, pillX + pillW / 2, pillY + 1.6, { align: "center" });

      // Category label
      pdf.setTextColor(tc[0], tc[1], tc[2]);
      pdf.setFontSize(5);
      const catText = CATEGORY_LABELS[block.category];
      pdf.text(catText, tx + pillW + 1, ty);
      ty += 2.8;
    }

    // ---- Coach name ----
    if (rh > 15 && block.coach_assigned && ty < ry + rh - 1) {
      pdf.setFont("Helvetica", "italic");
      pdf.setFontSize(5);
      pdf.setTextColor(tc[0], tc[1], tc[2]);
      const coachLines = pdf.splitTextToSize(block.coach_assigned, maxTW);
      pdf.text(coachLines[0], tx, ty);
      ty += 2.5;
    }

    // ---- Coaching points (first 1-2) ----
    if (rh > 20 && block.coaching_points.length > 0) {
      pdf.setFont("Helvetica", "normal");
      pdf.setFontSize(4.5);
      pdf.setTextColor(tc[0], tc[1], tc[2]);
      const maxPts = rh > 26 ? 2 : 1;
      for (let i = 0; i < Math.min(block.coaching_points.length, maxPts); i++) {
        if (ty > ry + rh - 1) break;
        const ptLines = pdf.splitTextToSize(`• ${block.coaching_points[i]}`, maxTW);
        pdf.text(ptLines[0], tx, ty);
        ty += 2;
      }
    }
  }

  // ---- Grid outer border ----
  pdf.setDrawColor(50, 50, 50);
  pdf.setLineWidth(0.4);
  pdf.rect(margin, gridTop, contentW, gridBottom - gridTop);

  // ========================================================================
  // 3. Footer
  // ========================================================================

  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text("Page 1 of 1", margin, pageH - 4);
  pdf.text("Generated by RRA Session Planner", pageW - margin, pageH - 4, {
    align: "right",
  });

  // ========================================================================
  // 4. Download
  // ========================================================================

  pdf.save(`RRA_Session_Plan_${session.date}.pdf`);
}
