/**
 * Simple stable hash for playbook item keys.
 * djb2 algorithm.
 */
export function stableKeyFromText(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
