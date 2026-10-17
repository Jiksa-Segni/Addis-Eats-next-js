/**
 * lib/format.js — shared formatting utilities.
 *
 * Built once, imported everywhere: pages, components, CSV routes.
 * Three exports only — etb, when, relative.
 */

/**
 * Format a number as Ethiopian Birr.
 *
 * etb(450)          → "450 ETB"
 * etb(1234.5)       → "1,234.50 ETB"
 * etb(null)         → "0 ETB"
 *
 * Uses Intl.NumberFormat for locale-aware thousands separators
 * while keeping the familiar "ETB" suffix the site already uses.
 */
export function etb(amount) {
  const n = Number(amount) || 0;
  const formatted = new Intl.NumberFormat("en-ET", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${formatted} ETB`;
}

/**
 * Format an ISO-8601 date string as a human-readable local date + time.
 *
 * when("2026-10-17T14:32:00.000Z") → "17 Oct 2026, 17:32"  (EAT = UTC+3)
 * when(null)                        → "—"
 */
export function when(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-ET", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Addis_Ababa",
  });
}

/**
 * Format an ISO-8601 date string as a human-readable relative time.
 *
 * relative("2026-10-17T14:32:00.000Z")  →  "2 hours ago"  (approximately)
 * relative(null)                          →  "—"
 *
 * Falls back gracefully when Intl.RelativeTimeFormat is unavailable
 * (e.g. in old Node versions used during SSR on the stream route).
 */
export function relative(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const diffMs = d.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);

  // Choose the right unit
  let value, unit;
  if (absSec < 60) {
    value = diffSec; unit = "second";
  } else if (absSec < 3600) {
    value = Math.round(diffSec / 60); unit = "minute";
  } else if (absSec < 86400) {
    value = Math.round(diffSec / 3600); unit = "hour";
  } else if (absSec < 86400 * 30) {
    value = Math.round(diffSec / 86400); unit = "day";
  } else if (absSec < 86400 * 365) {
    value = Math.round(diffSec / (86400 * 30)); unit = "month";
  } else {
    value = Math.round(diffSec / (86400 * 365)); unit = "year";
  }

  // Use Intl.RelativeTimeFormat when available
  if (typeof Intl !== "undefined" && Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    return rtf.format(value, unit);
  }

  // Minimal fallback
  const abs = Math.abs(value);
  const label = `${abs} ${unit}${abs !== 1 ? "s" : ""}`;
  return diffSec < 0 ? `${label} ago` : `in ${label}`;
}
