/**
 * Unit tests for spreadsheet-parser.ts
 *
 * Covers the pure functions: URL detection, ID extraction, the isSpreadsheet
 * classifier, and markdown formatting of an already-parsed workbook. Does
 * NOT exercise XLSX.read() (which needs a real binary blob) or the fetch
 * path to Google Sheets — both are trivial adapters around well-tested libs.
 *
 * Run with:
 *   cd app && ./node_modules/.bin/sucrase-node src/lib/spreadsheet-parser.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  extractGoogleSheetsId,
  findGoogleSheetsUrls,
  formatWorkbookForClaude,
  isSpreadsheetFile,
  type ParsedWorkbook,
} from "./spreadsheet-parser";

// ─── isSpreadsheetFile ────────────────────────────────────────────────────

test("isSpreadsheetFile recognises every supported extension", () => {
  for (const ext of ["xlsx", "xls", "xlsm", "ods", "csv", "tsv"]) {
    assert.equal(
      isSpreadsheetFile(`roster.${ext}`, ""),
      true,
      `.${ext} should be recognised`
    );
  }
});

test("isSpreadsheetFile recognises MIMEs with no extension", () => {
  assert.equal(
    isSpreadsheetFile("roster", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    true
  );
  assert.equal(
    isSpreadsheetFile("roster", "application/vnd.ms-excel"),
    true
  );
  assert.equal(isSpreadsheetFile("data", "text/csv"), true);
});

test("isSpreadsheetFile rejects unrelated files", () => {
  assert.equal(isSpreadsheetFile("photo.jpg", "image/jpeg"), false);
  assert.equal(isSpreadsheetFile("plan.pdf", "application/pdf"), false);
  assert.equal(isSpreadsheetFile("notes.txt", "text/plain"), false);
});

test("isSpreadsheetFile is case-insensitive on extension", () => {
  assert.equal(isSpreadsheetFile("Roster.XLSX", ""), true);
  assert.equal(isSpreadsheetFile("DATA.CSV", ""), true);
});

// ─── extractGoogleSheetsId ───────────────────────────────────────────────

test("extractGoogleSheetsId handles the standard edit URL", () => {
  const id = extractGoogleSheetsId(
    "https://docs.google.com/spreadsheets/d/1abcDEF_ghijklmnopqrstuvwxyz01234567/edit"
  );
  assert.equal(id, "1abcDEF_ghijklmnopqrstuvwxyz01234567");
});

test("extractGoogleSheetsId handles view URLs with gid fragments", () => {
  const id = extractGoogleSheetsId(
    "https://docs.google.com/spreadsheets/d/1AAAAAAAAAAAAAAAAAAAAAAAA/edit?gid=42#gid=42"
  );
  assert.equal(id, "1AAAAAAAAAAAAAAAAAAAAAAAA");
});

test("extractGoogleSheetsId handles /u/<n>/d/ prefix", () => {
  const id = extractGoogleSheetsId(
    "https://docs.google.com/spreadsheets/u/0/d/1BBBBBBBBBBBBBBBBBBBBBBBB/edit"
  );
  assert.equal(id, "1BBBBBBBBBBBBBBBBBBBBBBBB");
});

test("extractGoogleSheetsId returns null for non-Sheets URLs", () => {
  assert.equal(
    extractGoogleSheetsId("https://docs.google.com/document/d/xyz/edit"),
    null
  );
  assert.equal(extractGoogleSheetsId("https://example.com/file.xlsx"), null);
  assert.equal(extractGoogleSheetsId("not a url at all"), null);
});

// ─── findGoogleSheetsUrls ────────────────────────────────────────────────

test("findGoogleSheetsUrls pulls multiple URLs out of free text", () => {
  const text = `Here are two sheets:
  - https://docs.google.com/spreadsheets/d/1AAAAAAAAAAAAAAAAAAAAAAAA/edit
  - https://docs.google.com/spreadsheets/d/1BBBBBBBBBBBBBBBBBBBBBBBB/edit#gid=1

Please look at both.`;
  const results = findGoogleSheetsUrls(text);
  assert.equal(results.length, 2);
  assert.deepEqual(
    results.map((r) => r.id).sort(),
    ["1AAAAAAAAAAAAAAAAAAAAAAAA", "1BBBBBBBBBBBBBBBBBBBBBBBB"]
  );
});

test("findGoogleSheetsUrls deduplicates by sheet ID", () => {
  const text =
    "see https://docs.google.com/spreadsheets/d/1AAAAAAAAAAAAAAAAAAAAAAAA/edit and also https://docs.google.com/spreadsheets/d/1AAAAAAAAAAAAAAAAAAAAAAAA/view";
  const results = findGoogleSheetsUrls(text);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, "1AAAAAAAAAAAAAAAAAAAAAAAA");
});

test("findGoogleSheetsUrls returns empty on plain text", () => {
  assert.deepEqual(findGoogleSheetsUrls("just a message, no links"), []);
});

// ─── formatWorkbookForClaude ─────────────────────────────────────────────

test("formatWorkbookForClaude renders a multi-sheet workbook as markdown", () => {
  const workbook: ParsedWorkbook = {
    filename: "planning.xlsx",
    sheetCount: 2,
    totalChars: 0,
    sheets: [
      {
        name: "Coaches",
        headers: ["Name", "Role", "Rate"],
        rows: [
          ["Alex Lewis", "Head Coach", "40"],
          ["Shenan Dias", "Assistant", "30"],
        ],
        dataRowCount: 2,
        colCount: 3,
      },
      {
        name: "Squads",
        headers: ["Squad", "Lead"],
        rows: [["Squad 1", "Alex Thornhill"]],
        dataRowCount: 1,
        colCount: 2,
      },
    ],
  };
  const out = formatWorkbookForClaude(workbook);

  assert.match(out, /# Spreadsheet: planning\.xlsx/);
  assert.match(out, /This workbook has 2 sheets/);
  assert.match(out, /\*\*Sheets in order:\*\*/);
  assert.match(out, /- `Coaches` — 2 data rows × 3 columns/);
  assert.match(out, /- `Squads` — 1 data row × 2 columns/);
  assert.match(out, /## Sheet: Coaches/);
  assert.match(out, /## Sheet: Squads/);
  assert.match(out, /\| Name \| Role \| Rate \|/);
  assert.match(out, /\| Alex Lewis \| Head Coach \| 40 \|/);
  assert.match(out, /\| Squad 1 \| Alex Thornhill \|/);
});

test("formatWorkbookForClaude handles an empty sheet gracefully", () => {
  const workbook: ParsedWorkbook = {
    filename: "empty.xlsx",
    sheetCount: 1,
    totalChars: 0,
    sheets: [
      {
        name: "Sheet1",
        headers: [],
        rows: [],
        dataRowCount: 0,
        colCount: 0,
      },
    ],
  };
  const out = formatWorkbookForClaude(workbook);
  assert.match(out, /## Sheet: Sheet1/);
  assert.match(out, /_\(empty sheet\)_/);
});

test("formatWorkbookForClaude omits the sheet index for single-sheet workbooks", () => {
  const workbook: ParsedWorkbook = {
    filename: "single.csv",
    sheetCount: 1,
    totalChars: 0,
    sheets: [
      {
        name: "Sheet1",
        headers: ["A", "B"],
        rows: [["1", "2"]],
        dataRowCount: 1,
        colCount: 2,
      },
    ],
  };
  const out = formatWorkbookForClaude(workbook);
  assert.equal(out.includes("**Sheets in order:**"), false);
  assert.match(out, /This workbook has 1 sheet\./);
});
