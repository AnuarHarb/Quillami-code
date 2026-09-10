#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { dim, printBanner } from "./banner.js";
import { runTurn, type History } from "./agent/loop.js";
import { loadEnv } from "./env.js";
import { listMemoryFiles } from "./memory.js";
import {
  defaultModel,
  formatModelLine,
  formatModelList,
  resolveModel,
  type ModelChoice,
} from "./models.js";
import { createGate } from "./permissions.js";

function parseArgs(argv: string[]): { model?: string } {
  const args: { model?: string } = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--model" || token === "-m") {
      args.model = argv[index + 1];
      index += 1;
    }
  }
  return args;
}

function handleSlash(
  input: string,
  current: ModelChoice,
): { model: ModelChoice; handled: boolean } {
  const [command, ...rest] = input.split(/\s+/);
  if (command !== "/model" && command !== "/models") {
    return { model: current, handled: false };
  }

  const wanted = rest.join(" ").trim();
  if (!wanted) {
    console.log(`\n${formatModelList(current.id)}\n`);
    console.log(dim(`   actual: ${formatModelLine(current)}`));
    console.log(dim("   ejemplo: /model haiku\n"));
    return { model: current, handled: true };
  }

  const next = resolveModel(wanted);
  if (!next) {
    console.log(dim(`   no conozco "${wanted}". Prueba /model para ver la lista.\n`));
    return { model: current, handled: true };
  }

  console.log(dim(`   modelo: ${formatModelLine(next)}\n`));
  return { model: next, handled: true };
}

async function main(): Promise<void> {
  loadEnv();

  const args = parseArgs(process.argv.slice(2));
  let model = defaultModel();
  if (args.model) {
    const chosen = resolveModel(args.model);
    if (!chosen) {
      console.error(`No conozco el modelo "${args.model}".`);
      console.error(formatModelList(""));
      process.exit(1);
    }
    model = chosen;
  }

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
  console.log(dim(`   modelo: ${formatModelLine(model)}`));
  console.log(dim("   write, edit y bash piden permiso (s / n / a)."));
  console.log(dim("   /model cambia el modelo. /exit para salir.\n"));

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

      const slash = handleSlash(input, model);
      model = slash.model;
      if (slash.handled) continue;

      try {
        await runTurn(input, history, gate, model.id);
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
