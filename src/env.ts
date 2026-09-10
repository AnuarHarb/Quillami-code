import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

function loadEnvFile(envPath: string): void {
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadEnv(): void {
  loadEnvFile(path.resolve(process.cwd(), ".env"));
  loadEnvFile(path.join(homedir(), ".killami", ".env"));
}
