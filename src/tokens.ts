/** Claude-style estimate: ~4 characters per token. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) return String(tokens);
  if (tokens < 1_000_000) {
    const thousands = tokens / 1000;
    if (thousands >= 100) return `${Math.round(thousands)}k`;
    return `${thousands.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}

export function formatUsd(amount: number): string {
  if (amount <= 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
}
