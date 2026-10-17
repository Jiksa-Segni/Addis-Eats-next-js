/**
 * lib/csv.js — CSV serialisation and browser download helper.
 *
 * CORRECTNESS GUARANTEES
 * ─────────────────────
 * 1. Values containing commas:
 *      "Bole Road, Addis Ababa"  →  "Bole Road, Addis Ababa"
 *    The entire cell is wrapped in double-quotes, so the comma is inert.
 *
 * 2. Values containing double-quotes:
 *      He said "yes"  →  "He said ""yes"""
 *    Inner double-quotes are escaped by doubling them (RFC 4180 §2.7).
 *    A naive replace(/"/g, '\\"') produces invalid CSV that many parsers
 *    reject — this implementation uses the correct "" escape instead.
 *
 * 3. Values that start with =, +, -, @, \t, \r (CSV injection / formula injection):
 *    A leading single-quote prefix is prepended so spreadsheet applications
 *    do not execute the cell as a formula.
 *
 * 4. Null / undefined values are serialised as empty strings, not "null".
 *
 * 5. Line endings use CRLF (\r\n) as required by RFC 4180.
 *
 * 6. A UTF-8 BOM (\uFEFF) is prepended so Excel opens the file correctly
 *    without a manual encoding step.
 */

/**
 * Escape a single cell value according to RFC 4180.
 * @param {unknown} value
 * @returns {string}
 */
export function csvCell(value) {
  // Stringify, treating null/undefined as empty
  let text = value == null ? "" : String(value);

  // CSV-injection guard: prefix cells starting with dangerous characters
  if (/^[\s\u0000-\u001f]*[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  // Always wrap in double-quotes and escape any embedded double-quotes by doubling them
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Serialize a 2-D array of values to a CSV string.
 *
 * @param {Array<Array<unknown>>} rows  — first row is treated as the header
 * @returns {string}  UTF-8 CSV with BOM and CRLF line endings
 *
 * @example
 * toCsv([
 *   ["Name", "Price", "Note"],
 *   ["Kitfo", 500, 'Has "mitmita"'],
 *   ["Bole Road, Addis Ababa delivery", 0, ""],
 * ])
 */
export function toCsv(rows) {
  const body = rows
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  return `\uFEFF${body}`;
}

/**
 * Trigger a CSV file download in the browser.
 *
 * Must only be called from a client component (uses window / document).
 *
 * @param {string} filename  — e.g. "addis-eats-orders.csv"
 * @param {Array<Array<unknown>>} rows
 */
export function downloadCsv(filename, rows) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Clean up after the browser has started the download
  requestAnimationFrame(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
