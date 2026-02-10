const NERD_COOKIE = "scenarioledger_nerd";
const NERD_STORAGE = "scenarioledger_nerd";

/** Client-only: check if Nerd Mode is enabled (cookie or localStorage). */
export function isNerdModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (document.cookie.includes(`${NERD_COOKIE}=1`)) return true;
  return localStorage.getItem(NERD_STORAGE) === "1";
}

/** Client-only: enable Nerd Mode (cookie + localStorage). Cookie lasts 1 year. */
export function enableNerdMode(): void {
  if (typeof window === "undefined") return;
  document.cookie = `${NERD_COOKIE}=1; path=/; max-age=31536000; SameSite=Lax`;
  localStorage.setItem(NERD_STORAGE, "1");
}
