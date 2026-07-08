// Shared formatting + PII helpers. The masking util lives here so EVERY table /
// analytics / pattern view calls the SAME function (contract hard rule).

/**
 * Mask a phone / counterparty number, e.g. +8801712345678 -> +88017****5678.
 * Keeps a short leading group and the last 4 digits; everything between -> ****.
 * Non-phone-looking strings (< 7 digits) are returned unchanged.
 */
export function maskPhone(raw?: string | null): string {
  if (raw == null || raw === "") return "";
  const s = String(raw);
  const m = s.match(/^(\+?\d{4,6})\d+(\d{4})$/);
  if (m) return `${m[1]}****${m[2]}`;
  const digits = s.replace(/\D/g, "");
  if (digits.length >= 7) return `${s.slice(0, 3)}****${s.slice(-4)}`;
  return s;
}

/**
 * Canonical PII mask used by EVERY table/analytics view (contract hard rule:
 * "Single shared util, called everywhere"). Alias of {@link maskPhone} so call
 * sites read as `mask(counterparty)`.
 */
export const mask = maskPhone;

/**
 * The backend serializes stored_at/updated_at as NAIVE UTC (no trailing "Z" or
 * offset, e.g. "2026-07-08T16:17:57.420881"). JS's Date would read those as
 * LOCAL time, skewing "last hour" and relative-time math by the viewer's offset.
 * Normalize by treating any offset-less timestamp as UTC.
 */
export function parseTimestamp(iso?: string | null): Date | null {
  if (!iso) return null;
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(iso);
  const d = new Date(hasZone || !iso.includes("T") ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ISO 8601 -> local, human-readable. Falls back to the raw string if unparseable. */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = parseTimestamp(iso);
  if (!d) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO 8601 -> "just now" / "3m ago" / "2h ago". Falls back to a date. */
export function timeAgo(iso?: string | null, now: number = Date.now()): string {
  if (!iso) return "—";
  const d = parseTimestamp(iso);
  if (!d) return iso;
  const secs = Math.max(0, Math.round((now - d.getTime()) / 1000));
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDateTime(iso);
}

/** 0.9 -> "90%" */
export function formatConfidence(c?: number | null): string {
  if (c == null || Number.isNaN(c)) return "—";
  return `${Math.round(c * 100)}%`;
}

/** wrong_transfer -> "Wrong transfer" for display (never sent back to the API). */
export function humanize(value?: string | null): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
