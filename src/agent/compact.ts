import Anthropic from "@anthropic-ai/sdk";
import { dim } from "../banner.js";
import { startSpinner } from "../spinner.js";

const COMPACT_AFTER_CHARS = 80_000;
const KEEP_TAIL_CHARS = 28_000;
const MAX_TRANSCRIPT_CHARS = 60_000;
const MAX_MESSAGE_IN_TRANSCRIPT = 2_000;

export async function compactIfNeeded(
  client: Anthropic,
  model: string,
  history: Anthropic.MessageParam[],
): Promise<void> {
  if (totalChars(history) < COMPACT_AFTER_CHARS) {
    return;
  }

  const cut = findTailStart(history);
  if (cut <= 0) {
    return;
  }

  const prefix = history.slice(0, cut);
  const tail = history.slice(cut);
  const stopSpinner = startSpinner("Compactando el historial…");

  try {
    const summary = await summarizePrefix(client, model, prefix);
    history.splice(
      0,
      history.length,
      {
        role: "user",
        content: `Resumen de la conversación anterior. Úsalo como contexto y no lo contradigas:\n\n${summary}`,
      },
      {
        role: "assistant",
        content: "Entendido. Sigo desde ese resumen.",
      },
      ...tail,
    );
    process.stdout.write(`${dim("  Historial compactado.")}\n`);
  } catch {
    // If the summary call fails, keep the full history and continue.
  } finally {
    stopSpinner();
  }
}

export function findTailStart(history: Anthropic.MessageParam[]): number {
  let chars = 0;
  let index = history.length;

  while (index > 0 && chars < KEEP_TAIL_CHARS) {
    index -= 1;
    chars += messageChars(history[index]);
  }

  while (index > 0 && isToolResultMessage(history[index])) {
    index -= 1;
  }

  if (index < 2) {
    return -1;
  }

  return index;
}

async function summarizePrefix(
  client: Anthropic,
  model: string,
  prefix: Anthropic.MessageParam[],
): Promise<string> {
  const response = await client.messages.create({
    model,
    max_tokens: 800,
    system:
      "Summarize this coding-agent conversation for a later session. Keep user goals, files touched, decisions, errors, and what is still pending. Be concise. Use the user's language.",
    messages: [
      {
        role: "user",
        content: toTranscript(prefix),
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("empty summary");
  }

  return text;
}

function toTranscript(messages: Anthropic.MessageParam[]): string {
  const parts = messages.map((message) => {
    const body = flattenContent(message.content).slice(0, MAX_MESSAGE_IN_TRANSCRIPT);
    return `${message.role}: ${body}`;
  });

  let transcript = parts.join("\n\n");
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    transcript = transcript.slice(-MAX_TRANSCRIPT_CHARS);
  }
  return transcript;
}

function flattenContent(content: Anthropic.MessageParam["content"]): string {
  if (typeof content === "string") {
    return content;
  }

  return content
    .map((block) => {
      if (block.type === "text") return block.text;
      if (block.type === "tool_use") {
        return `[tool ${block.name} ${summarizeToolInput(block.input)}]`;
      }
      if (block.type === "tool_result") {
        const body =
          typeof block.content === "string"
            ? block.content
            : JSON.stringify(block.content);
        return `[tool_result ${body}]`;
      }
      return `[${block.type}]`;
    })
    .join("\n");
}

function summarizeToolInput(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const record = input as Record<string, unknown>;
  const value = record.path ?? record.command ?? record.pattern;
  return typeof value === "string" ? value : "";
}

function isToolResultMessage(message: Anthropic.MessageParam): boolean {
  if (message.role !== "user" || typeof message.content === "string") {
    return false;
  }
  return message.content.some((block) => block.type === "tool_result");
}

function messageChars(message: Anthropic.MessageParam): number {
  return flattenContent(message.content).length;
}

function totalChars(history: Anthropic.MessageParam[]): number {
  return history.reduce((sum, message) => sum + messageChars(message), 0);
}
