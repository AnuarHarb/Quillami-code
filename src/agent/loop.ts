import Anthropic from "@anthropic-ai/sdk";
import { executeTool, TOOL_DEFINITIONS } from "../tools.ts";

const MAX_ITERATIONS = 20;

const SYSTEM_PROMPT = `You are killa-code, a local coding agent.
You work inside the user's current workspace and use tools to inspect and edit files.
Prefer small, targeted edits over rewriting whole files.
If a tool fails, read the error and try another approach.
Respond in the user's language.`;

export type History = Anthropic.MessageParam[];

export async function runTurn(userMessage: string, history: History): Promise<void> {
  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

  history.push({ role: "user", content: userMessage });

  for (let step = 0; step < MAX_ITERATIONS; step += 1) {
    const response = await client.messages.create({
      model,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS,
      messages: history,
    });

    history.push({ role: "assistant", content: response.content });

    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) {
        console.log(`\n${block.text}`);
      }
    }

    if (response.stop_reason !== "tool_use") {
      return;
    }

    const results: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const input = block.input;
      const preview = summarizeInput(input);
      console.log(`\n· ${block.name}${preview ? ` ${preview}` : ""}`);

      let output: string;
      try {
        output = await executeTool(block.name, input);
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

function summarizeInput(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const record = input as Record<string, unknown>;
  const value = record.path ?? record.command ?? record.pattern;
  return typeof value === "string" ? value : "";
}
