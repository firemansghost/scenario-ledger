/**
 * Softmax over an object of scenario keys to probabilities (sum = 1).
 */
export function softmax(scores: Record<string, number>): Record<string, number> {
  return softmaxWithTemperature(scores, 1);
}

/** Softmax with temperature: score_i / temperature before exp. */
export function softmaxWithTemperature(
  scores: Record<string, number>,
  temperature: number
): Record<string, number> {
  const keys = Object.keys(scores);
  if (keys.length === 0) return {};
  const t = Math.max(temperature, 1e-6);
  const values = keys.map((k) => (scores[k] ?? 0) / t);
  const max = Math.max(...values);
  const exp = values.map((v) => Math.exp(v - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  const probs: Record<string, number> = {};
  keys.forEach((k, i) => {
    probs[k] = sum > 0 ? exp[i]! / sum : 1 / keys.length;
  });
  return probs;
}
