/**
 * Prettify internal keys for user-facing display.
 * Use indicator_definitions.name when available; fallback to this.
 */
export function prettifyKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
