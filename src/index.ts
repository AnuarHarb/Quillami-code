#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { dim, printBanner } from "./banner.js";
import { runTurn, type History } from "./agent/loop.js";
import { listMemoryFiles } from "./memory.js";
import { createGate } from "./permissions.js";

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

function loadEnv(): void {
  loadEnvFile(path.resolve(process.cwd(), ".env"));
  loadEnvFile(path.join(homedir(), ".killami", ".env"));
}

async function main(): Promise<void> {
  loadEnv();

  printBanner();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "Falta ANTHROPIC_API_KEY. Ponla en .env del proyecto o en ~/.killami/.env",
    );
    process.exit(1);
  }

  console.log(dim(`   workspace: ${process.cwd()}`));
  const memoryFiles = listMemoryFiles();
  console.log(
    dim(
      memoryFiles.length > 0
        ? `   memoria: ${memoryFiles.join(", ")}`
        : "   memoria: ninguna (puedes crear KILLAMI.md)",
    ),
  );
  console.log(dim("   write, edit y bash piden permiso (s / n / a)."));
  console.log(dim("   Escribe /exit para salir.\n"));

  const rl = createInterface({ input: stdin, output: stdout });
  const history: History = [];
  const gate = createGate(async (prompt) => {
    try {
      return await rl.question(prompt);
    } catch {
      return "n";
    }
  });

  try {
    while (true) {
      let input: string;
      try {
        if (stdin.readableEnded) break;
        input = (await rl.question("> ")).trim();
      } catch {
        break;
      }
      if (!input) continue;
      if (input === "/exit" || input === "/quit") break;

      try {
        await runTurn(input, history, gate);
        console.log("");
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
      }
    }
  } finally {
    rl.close();
  }
}

await main();
