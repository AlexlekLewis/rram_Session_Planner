/**
 * Client-side spreadsheet parser for the AI Coach.
 *
 * Reads .xlsx / .xls / .csv / .tsv files (and public Google Sheets via the
 * /export?format=xlsx endpoint) and converts every sheet to markdown text so
 * the Claude API can ingest the whole workbook as part of the message body.
 *
 * Why client-side: keeps the Next.js API route small, avoids uploading binary
 * spreadsheets to the server, and works for any size up to the browser's
 * ArrayBuffer limit. The parsed text is what actually reaches Anthropic —
 * not the binary bytes — so the only size limit that matters is the total
 * chat-message token budget.
 *
 * IMPORTANT: the xlsx (SheetJS) module is imported DYNAMICALLY inside
 * `parseArrayBuffer`. SheetJS weighs ~320 KB minified and it's only needed
 * when the user actually drops a spreadsheet — a static import would pull
 * the whole library into the shared dashboard chunk and slow down every
 * session-planner page load. Dynamic import means it's code-split into its
 * own lazy chunk and fetched on first parse.
 *
 * PATTERN: SheetJS (xlsx) in the browser with arrayBuffer() input.
 * SOURCE: https://docs.sheetjs.com/docs/demos/frontend/
 */

// ─── Types ────────────────────────────────────────────────────────────────

/** A single parsed sheet from a workbook */
export interface ParsedSheet {
  /** Sheet name as it appears in the tab strip */
  name: string;
  /** Total rows of data (excluding the header row if one was detected) */
  dataRowCount: number;
  /** Total columns (max width of any row) */
  colCount: number;
  /** First row, treated as headers. May be empty strings. */
  headers: string[];
  /** Remaining rows, each as an array of cell strings. Length matches colCount. */
  rows: string[][];
}

/** A fully parsed workbook, ready to be formatted for Claude */
export interface ParsedWorkbook {
  /** Original filename (or derived name for Google Sheets) */
  filename: string;
  /** Number of sheets in the workbook */
  sheetCount: number;
  /** Parsed sheets in tab order */
  sheets: ParsedSheet[];
  /** Total character count of the formatted text representation */
  totalChars: number;
}

// ─── File / Blob parsing ──────────────────────────────────────────────────

/**
 * File extensions and MIME types we recognise as spreadsheets.
 * Browsers are inconsistent about MIME for .csv and older .xls files,
 * so we check extension as a fallback.
 */
const SPREADSHEET_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls (and sometimes .csv on Windows)
  "application/vnd.ms-excel.sheet.macroenabled.12", // .xlsm
  "application/vnd.oasis.opendocument.spreadsheet", // .ods
  "text/csv",
  "text/tab-separated-values",
  // Intentionally NOT accepting "text/plain" — some browsers label CSVs that
  // way but so do plain .txt files; a .txt file with a spreadsheet MIME is
  // vanishingly rare. The extension check below catches real .csv/.tsv files.
]);

const SPREADSHEET_EXTENSIONS = new Set([
  "xlsx",
  "xls",
  "xlsm",
  "ods",
  "csv",
  "tsv",
]);

/** Check whether a file looks like a spreadsheet by extension or MIME. */
export function isSpreadsheetFile(filename: string, mimeType?: string): boolean {
  if (mimeType && SPREADSHEET_MIME_TYPES.has(mimeType)) return true;
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  return SPREADSHEET_EXTENSIONS.has(ext);
}

/**
 * Parse a File (from drag-drop, file picker, or DataTransfer) into a workbook.
 */
export async function parseSpreadsheetFile(file: File): Promise<ParsedWorkbook> {
  const buf = await file.arrayBuffer();
  return parseArrayBuffer(buf, file.name);
}

/**
 * Parse a Blob (e.g. the response from a Google Sheets export fetch) into a
 * workbook. The caller supplies the desired display filename.
 */
export async function parseSpreadsheetBlob(
  blob: Blob,
  filename: string
): Promise<ParsedWorkbook> {
  const buf = await blob.arrayBuffer();
  return parseArrayBuffer(buf, filename);
}

async function parseArrayBuffer(buf: ArrayBuffer, filename: string): Promise<ParsedWorkbook> {
  // Lazy-load SheetJS — this keeps the library out of the main dashboard
  // bundle until the user actually drops a spreadsheet. The import is cached
  // by the module system so subsequent calls hit the same promise instantly.
  const XLSX = await import("xlsx");

  // cellDates:true → Date objects instead of Excel serial numbers.
  // cellNF / cellText:false → we'll format numbers/dates ourselves via sheet_to_json({raw:false}).
  const workbook = XLSX.read(buf, { type: "array", cellDates: true });

  const sheets: ParsedSheet[] = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    // header:1 gives us a plain 2D array (no header inference). defval:"" fills
    // empty cells with empty string. raw:false formats numbers/dates to strings.
    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    });

    // Normalise every cell to a string, trimmed, with pipes/newlines escaped for
    // markdown table safety.
    const stringRows: string[][] = rawRows.map((row) =>
      row.map((cell) => normaliseCell(cell))
    );

    // Find the widest row so every row has the same length (markdown tables
    // require consistent column counts).
    const colCount = stringRows.reduce((max, row) => Math.max(max, row.length), 0);
    const padded = stringRows.map((row) => {
      const out = row.slice();
      while (out.length < colCount) out.push("");
      return out;
    });

    // Treat the first non-empty row as headers. If every cell in the first row
    // is empty, emit synthetic column labels (Col 1, Col 2, …) so the table
    // still renders.
    let headers: string[] = [];
    let dataRows: string[][] = [];
    if (padded.length > 0) {
      const first = padded[0];
      const firstHasContent = first.some((c) => c.length > 0);
      if (firstHasContent) {
        headers = first;
        dataRows = padded.slice(1);
      } else {
        headers = Array.from({ length: colCount }, (_, i) => `Col ${i + 1}`);
        dataRows = padded;
      }
    }

    return {
      name,
      dataRowCount: dataRows.length,
      colCount,
      headers,
      rows: dataRows,
    };
  });

  const workbookForFormatting: ParsedWorkbook = {
    filename,
    sheetCount: sheets.length,
    sheets,
    totalChars: 0, // filled in below
  };

  workbookForFormatting.totalChars = formatWorkbookForClaude(workbookForFormatting).length;
  return workbookForFormatting;
}

/**
 * Normalise a single cell value to a string safe for inclusion in a markdown
 * table row. Pipes are escaped, newlines are replaced with `<br>`, runs of
 * whitespace are collapsed.
 */
function normaliseCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str: string;
  if (value instanceof Date) {
    // YYYY-MM-DD if the date has no time component, otherwise ISO string
    const iso = value.toISOString();
    str = iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso;
  } else {
    str = String(value);
  }
  return str
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Formatting for Claude ────────────────────────────────────────────────

/**
 * Format a parsed workbook as plain-text markdown that Claude can ingest
 * directly. Every sheet gets:
 *   - an H2 heading with the sheet name
 *   - a one-line stat summary (rows × cols)
 *   - a markdown table with headers and every data row
 *
 * The top of the document includes an H1 with the filename, a sheet index,
 * and instructions telling Claude to treat the sheets as a single workbook.
 */
export function formatWorkbookForClaude(workbook: ParsedWorkbook): string {
  const lines: string[] = [];

  lines.push(`# Spreadsheet: ${workbook.filename}`);
  lines.push("");
  lines.push(
    `This workbook has ${workbook.sheetCount} sheet${workbook.sheetCount === 1 ? "" : "s"}. ` +
      `Each sheet below is rendered as a markdown table. Treat the entire workbook ` +
      `as one document — sheets often reference each other.`
  );
  lines.push("");

  if (workbook.sheetCount > 1) {
    lines.push("**Sheets in order:**");
    for (const sheet of workbook.sheets) {
      lines.push(
        `- \`${sheet.name}\` — ${sheet.dataRowCount} data row${sheet.dataRowCount === 1 ? "" : "s"} × ${sheet.colCount} column${sheet.colCount === 1 ? "" : "s"}`
      );
    }
    lines.push("");
  }

  for (const sheet of workbook.sheets) {
    lines.push(`## Sheet: ${sheet.name}`);
    lines.push("");

    if (sheet.dataRowCount === 0 && sheet.headers.length === 0) {
      lines.push("_(empty sheet)_");
      lines.push("");
      continue;
    }

    lines.push(
      `_${sheet.dataRowCount} data row${sheet.dataRowCount === 1 ? "" : "s"} × ${sheet.colCount} column${sheet.colCount === 1 ? "" : "s"}_`
    );
    lines.push("");

    // Markdown table
    lines.push(`| ${sheet.headers.join(" | ")} |`);
    lines.push(`| ${sheet.headers.map(() => "---").join(" | ")} |`);
    for (const row of sheet.rows) {
      lines.push(`| ${row.join(" | ")} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Google Sheets URL handling ───────────────────────────────────────────

/**
 * Match a Google Sheets URL and extract the spreadsheet ID.
 * Accepts every format we've seen in the wild:
 *   https://docs.google.com/spreadsheets/d/{ID}/edit
 *   https://docs.google.com/spreadsheets/d/{ID}/edit?gid=123#gid=123
 *   https://docs.google.com/spreadsheets/d/{ID}/view
 *   https://docs.google.com/spreadsheets/d/{ID}
 *   https://docs.google.com/spreadsheets/u/0/d/{ID}/...
 */
const GOOGLE_SHEETS_URL_RE =
  /https?:\/\/docs\.google\.com\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]{20,})/g;

/** Extract the spreadsheet ID from a single URL. Returns null if it's not a Google Sheets URL. */
export function extractGoogleSheetsId(url: string): string | null {
  const re = new RegExp(GOOGLE_SHEETS_URL_RE.source);
  const match = re.exec(url);
  return match ? match[1] : null;
}

/** Scan a block of text for every Google Sheets URL. Returns deduplicated {url, id} entries. */
export function findGoogleSheetsUrls(text: string): { url: string; id: string }[] {
  const seen = new Set<string>();
  const results: { url: string; id: string }[] = [];
  const re = new RegExp(GOOGLE_SHEETS_URL_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    results.push({ url: match[0], id });
  }
  return results;
}

/**
 * Fetch a public Google Sheet as an xlsx Blob.
 *
 * Uses the `/export?format=xlsx` endpoint which returns the entire workbook
 * (every sheet/tab) as a single .xlsx file. Works for sheets shared as
 * "Anyone with the link — viewer" without OAuth. Private sheets return an HTML
 * login page, which this function detects and surfaces as a clear error.
 */
export async function fetchGoogleSheetAsXlsx(sheetId: string): Promise<Blob> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
  const response = await fetch(url, {
    // Explicit no-cors/credentials defaults — we want the raw binary.
    method: "GET",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `Google Sheets returned ${response.status} — the sheet is probably private. Share it as "Anyone with link: Viewer" and try again.`
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  // If the sheet is private, Google redirects us to an HTML login page.
  if (contentType.includes("text/html")) {
    throw new Error(
      `Google Sheets returned a login page — that sheet isn't publicly viewable. Share it as "Anyone with link: Viewer" and try again.`
    );
  }

  return await response.blob();
}
