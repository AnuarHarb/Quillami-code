import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const MEMORY_FILES = ["KILLAMI.md", "AGENTS.md"] as const;

const MAX_CHARS = 16_000;

export function listMemoryFiles(root = process.cwd()): string[] {
  return MEMORY_FILES.filter((name) => existsSync(path.join(root, name)));
}

export function loadProjectMemory(root = process.cwd()): string {
  const chunks: string[] = [];

  for (const name of listMemoryFiles(root)) {
    const full = path.join(root, name);
    let text = readFileSync(full, "utf8").trim();
    if (!text) continue;
    if (text.length > MAX_CHARS) {
      text = `${text.slice(0, MAX_CHARS)}\n…(truncated)`;
    }
    chunks.push(`### ${name}\n${text}`);
  }

  return chunks.join("\n\n");
}
