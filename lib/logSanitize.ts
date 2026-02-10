/**
 * Sanitize and truncate messages before writing to data_fetch_logs.
 * Prevents storing long API responses or accidental secrets.
 */
export function sanitizeLogMessage(msg: string | null | undefined, maxLen = 180): string {
  const cleaned = (msg ?? "")
    .replace(/\s+/g, " ")
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]")
    .trim();
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen - 1) + "…" : cleaned;
}
