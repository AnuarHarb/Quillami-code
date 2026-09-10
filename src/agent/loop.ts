import Anthropic from "@anthropic-ai/sdk";
import { type CheckpointStore } from "../checkpoint.js";
import { compactIfNeeded } from "./compact.js";
import { loadProjectMemory } from "../memory.js";
import { type PermissionGate } from "../permissions.js";
import { startSpinner } from "../spinner.js";
import { executeTool, TOOL_DEFINITIONS } from "../tools.js";

const MAX_ITERATIONS = 20;

const SYSTEM_PROMPT = `You are Killami Code, a local coding agent.
You work inside the user's current workspace and use tools to inspect and edit files.
Prefer small, targeted edits over rewriting whole files.
If a tool fails, read the error and try another approach.
write, edit, and bash need the user's approval. If they deny a tool, do not retry it unless they ask.
Follow KILLAMI.md and AGENTS.md when they exist. If the user asks you to remember something about this repo, add it to KILLAMI.md.
Respond in the user's language.`;

export type History = Anthropic.MessageParam[];

export async function runTurn(
  userMessage: string,
  history: History,
  gate: PermissionGate,
  model: string,
  checkpoints: CheckpointStore,
): Promise<void> {
  const client = new Anthropic();

  history.push({ role: "user", content: userMessage });
  checkpoints.beginTurn();

  try {
    await runToolLoop(client, model, history, gate, checkpoints);
  } finally {
    checkpoints.finishTurn();
  }
}

async function runToolLoop(
  client: Anthropic,
  model: string,
  history: History,
  gate: PermissionGate,
  checkpoints: CheckpointStore,
): Promise<void> {
  for (let step = 0; step < MAX_ITERATIONS; step += 1) {
    await compactIfNeeded(client, model, history);
    const response = await streamAssistant(client, model, history);
    history.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      return;
    }

    const results: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const preview = summarizeInput(block.input);
      process.stdout.write(`\n· ${block.name}${preview ? ` ${preview}` : ""}\n`);

      const allowed = await gate.authorize(block.name, block.input);
      if (!allowed) {
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content:
            "The user denied this action. Do not retry it unless they explicitly ask.",
        });
        continue;
      }

      if (block.name === "write" || block.name === "edit") {
        const target = filePathOf(block.input);
        if (target) {
          await checkpoints.snapshot(target);
        }
      }

      let output: string;
      try {
        output = await executeTool(block.name, block.input);
      } catch (error) {
        output = `Error: ${error instanceof Error ? error.message : String(error)}`;
      }

      results.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: output,
      });
    }

    history.push({ role: "user", content: results });
  }

  console.log("\nStopped: too many tool steps in this turn.");
}

async function streamAssistant(
  client: Anthropic,
  model: string,
  history: History,
): Promise<Anthropic.Message> {
  const stopSpinner = startSpinner();

  try {
    const stream = client.messages.stream({
      model,
      max_tokens: 8000,
      system: buildSystemPrompt(),
      tools: TOOL_DEFINITIONS,
      messages: history,
    });

    let started = false;
    stream.on("text", (delta) => {
      if (!started) {
        stopSpinner();
        process.stdout.write("\n");
        started = true;
      }
      process.stdout.write(delta);
    });

    const message = await stream.finalMessage();
    stopSpinner();
    if (started) {
      process.stdout.write("\n");
    }
    return message;
  } catch (error) {
    stopSpinner();
    throw error;
  }
}

function buildSystemPrompt(): string {
  const memory = loadProjectMemory();
  if (!memory) {
    return `${SYSTEM_PROMPT}

There is no KILLAMI.md or AGENTS.md in this workspace yet. If the user wants durable notes about the project, create KILLAMI.md.`;
  }

  return `${SYSTEM_PROMPT}

Project memory. Treat this as the source of truth for how this repo works:

${memory}`;
}

function filePathOf(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const path = (input as Record<string, unknown>).path;
  return typeof path === "string" && path.length > 0 ? path : null;
}

function summarizeInput(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const record = input as Record<string, unknown>;
  const value = record.path ?? record.command ?? record.pattern;
  return typeof value === "string" ? value : "";
}
